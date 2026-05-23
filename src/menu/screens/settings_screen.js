import { menu } from '../navigation.js';
import { mute_input, unmute_input } from '../../ui/input.js';
import header from '../../ui/header.js';
import { baseUrlScreen } from './base_url_screen.js';
import { modelScreen } from './model_screen.js';
import { toolsScreen } from './tools_screen.js';
import { sshHostsScreen } from './ssh_hosts_screen.js';
import { backupScreen } from './backup_screen.js';
import { envScreen } from './env_screen.js';

const screens = {
  'Base URL': baseUrlScreen,
  'Model': modelScreen,
  'Tools': toolsScreen,
  'SSH Hosts': sshHostsScreen,
  'Backup': backupScreen,
  'Env Vars': envScreen,
};

export async function settingsScreen() {
  while (true) {
    console.clear();
    await header();
    mute_input();
    const choice = await menu('Settings', Object.keys(screens).concat('Back'));
    unmute_input();
    if (choice === 'Back' || choice === null) return;
    const handler = screens[choice];
    if (handler) await handler();
  }
}

