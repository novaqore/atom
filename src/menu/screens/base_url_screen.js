import { menu } from '../navigation.js';
import { mute_input, unmute_input, prompt } from '../../ui/input.js';
import header from '../../ui/header.js';
import { loadEnv, saveEnv } from '../../config/env.js';
import { colors } from '../../ui/theme.js';


export async function baseUrlScreen() {
  while (true) {
    console.clear();
    await header();

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

      }
    }
  }
}
