import { menu } from './navigation.js';
import { mute_input, unmute_input } from '../ui/input.js';
import header from '../ui/header.js';
import { colors } from '../ui/theme.js';
import { settingsScreen } from './screens/settings_screen.js';
import app from '../app.js';

const intro = [
  'Welcome to Atom, a server agent that lives in your shell with system level access.',
  'It can run shell commands, edit files surgically with sed, and hop into any host in your SSH config to operate there interactively.',
  `${colors.yellow}Warning:${colors.reset} ${colors.grey}this is experimental software, use it on isolated machines and review what it does before trusting it on anything important.${colors.reset}`,
  `${colors.grey}More info: https://github.com/novaqore/atom#readme${colors.reset}`,
].join('\n');

export async function mainMenu() {
  while (true) {
    console.clear();
    await header();
    mute_input();
    const choice = await menu(intro, ['Chat', 'Settings', 'Exit']);
    unmute_input();
    if (choice === 'Chat') {
      await app();
      return;
    }
    if (choice === 'Settings') {
      await settingsScreen();
      continue;
    }
    process.exit(0);
  }
}
