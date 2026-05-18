import { menu } from '../navigation.js';
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

export async function modelScreen() {
  while (true) {
    console.clear();
    header();

    const env = loadEnv();
    const model = env?.MODEL;
    const display = model
      ? `Model: ${colors.cyan}${model}${colors.reset}`
      : `${colors.grey}No Model set${colors.reset}`;

    mute_input();
    const choice = await menu(display, ['Set Model', 'Back']);
    unmute_input();

    if (choice === 'Back' || choice === null) return;

    if (choice === 'Set Model') {
      const value = await prompt('Enter new Model (ESC to cancel):');
      if (value) {
        const current = loadEnv() || {};
        current.MODEL = value;
        saveEnv(current);
        saveToShellEnv('MODEL', value);
      }
    }
  }
}
