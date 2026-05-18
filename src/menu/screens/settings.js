import { menu } from '../../helpers/menu.js';
import { mute_input, unmute_input } from '../../helpers/input.js';
import header from '../../components/header.js';
import { baseUrlScreen } from './base_url.js';
import { systemPromptScreen } from './system_prompt.js';
import { sshHostsScreen } from './ssh_hosts.js';

export async function settingsScreen() {
  while (true) {
    console.clear();
    header();
    mute_input();
    const choice = await menu('Settings', ['Base URL', 'System Prompt', 'SSH Hosts', 'Back']);
    unmute_input();
    if (choice === 'Back' || choice === null) return;
    if (choice === 'Base URL') await baseUrlScreen();
    else if (choice === 'System Prompt') await systemPromptScreen();
    else if (choice === 'SSH Hosts') await sshHostsScreen();
  }
}
