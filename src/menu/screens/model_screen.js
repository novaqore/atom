import { menu } from '../navigation.js';
import { mute_input, unmute_input, prompt } from '../../ui/input.js';
import header from '../../ui/header.js';
import { loadEnv, saveEnv } from '../../config/env.js';
import { colors } from '../../ui/theme.js';


export async function modelScreen() {
  while (true) {
    console.clear();
    await header();

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

      }
    }
  }
}
