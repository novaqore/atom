import { menu } from '../../helpers/menu.js';
import { mute_input, unmute_input } from '../../helpers/input.js';
import header from '../../components/header.js';
import { backup } from '../../system/details/backup.js';
import { colors } from '../../utils/theme.js';

export async function backupScreen() {
  console.clear();
  header();
  mute_input();
  await menu(`Backup size: ${colors.cyan}${backup}${colors.reset}`, ['Back']);
  unmute_input();
}
