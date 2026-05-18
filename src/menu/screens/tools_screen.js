import { menu } from '../navigation.js';
import { mute_input, unmute_input } from '../../helpers/input.js';
import header from '../../components/header.js';

export async function toolsScreen() {
  console.clear();
  header();
  mute_input();
  await menu('Tools', ['Back']);
  unmute_input();
}
