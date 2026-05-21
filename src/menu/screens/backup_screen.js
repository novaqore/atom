import { menu } from '../navigation.js';
import { mute_input, unmute_input } from '../../ui/input.js';
import header from '../../ui/header.js';

import { colors } from '../../ui/theme.js';

export async function backupScreen() {
  console.clear();
  await header();
  mute_input();
  await menu('Backup', ['Back']);
  unmute_input();
}
