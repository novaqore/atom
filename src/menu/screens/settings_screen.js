import { menu } from '../../helpers/menu.js';
import { mute_input, unmute_input } from '../../helpers/input.js';
import header from '../../components/header.js';
import { baseUrlScreen } from './base_url_screen.js';
import { toolsScreen } from './tools_screen.js';
import { sshHostsScreen } from './ssh_hosts_screen.js';
import { backupScreen } from './backup_screen.js';

export async function settingsScreen() {
  while (true) {
    console.clear();
    header();
    mute_input();
    const choice = await menu('Settings', ['Base URL', 'Tools', 'SSH Hosts', 'Backup', 'Back']);
    unmute_input();
    if (choice === 'Back' || choice === null) return;
    if (choice === 'Base URL') await baseUrlScreen();
    else if (choice === 'Tools') await toolsScreen();
    else if (choice === 'SSH Hosts') await sshHostsScreen();
    else if (choice === 'Backup') await backupScreen();
  }
}
