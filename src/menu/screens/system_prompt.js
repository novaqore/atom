import { menu } from '../../helpers/menu.js';
import { mute_input, unmute_input } from '../../helpers/input.js';
import header from '../../components/header.js';

export async function systemPromptScreen() {
  console.clear();
  header();
  mute_input();
  await menu('System Prompt', ['Back']);
  unmute_input();
}
