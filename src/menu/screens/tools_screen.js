import { menu } from '../navigation.js';
import { mute_input, unmute_input } from '../../ui/input.js';
import header from '../../ui/header.js';

export async function toolsScreen() {
  console.clear();
  await header();
  mute_input();
  await menu('Tools', ['Back']);
  unmute_input();
}
