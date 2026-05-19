import { menu } from '../navigation.js';
import { mute_input, unmute_input } from '../../ui/input.js';
import header from '../../ui/header.js';
import { getBackupSize } from '../../system/details/backup.js';
import { colors } from '../../ui/theme.js';

export async function backupScreen() {
  console.clear();
  await header();
  mute_input();
  await menu(`Backup size: ${colors.cyan}${getBackupSize()}${colors.reset}`, ['Back']);
  unmute_input();
}
