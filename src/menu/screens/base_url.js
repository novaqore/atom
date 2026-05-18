import { menu } from '../../helpers/menu.js';
import { mute_input, unmute_input, rl } from '../../helpers/input.js';
import header from '../../components/header.js';
import { loadEnv, saveEnv, saveToShellEnv } from '../../utils/env.js';
import { colors } from '../../utils/theme.js';

function prompt(question) {
  return new Promise((resolve) => {
    let escaped = false;
    const onKey = (_, key) => {
      if (key?.name === 'escape' && !escaped) {
        escaped = true;
        process.stdin.emit('keypress', '\r', { name: 'return', sequence: '\r' });
      }
    };
    process.stdin.on('keypress', onKey);
    rl.question(`${question} `, (answer) => {
      process.stdin.off('keypress', onKey);
      resolve(escaped ? null : answer.trim());
    });
  });
}

export async function baseUrlScreen() {
  while (true) {
    console.clear();
    header();

    const env = loadEnv();
    const url = env?.NOVAQORE_INTERNAL_URL;
    const display = url
      ? `Base URL: ${colors.cyan}${url}${colors.reset}`
      : `${colors.grey}No Base URL set${colors.reset}`;

    mute_input();
    const choice = await menu(display, ['Set Base URL', 'Back']);
    unmute_input();

    if (choice === 'Back' || choice === null) return;

    if (choice === 'Set Base URL') {
      const value = await prompt('Enter new Base URL (ESC to cancel):');
      if (value) {
        const current = loadEnv() || {};
        current.NOVAQORE_INTERNAL_URL = value;
        saveEnv(current);
        saveToShellEnv('NOVAQORE_INTERNAL_URL', value);
      }
    }
  }
}
