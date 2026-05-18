import { menu } from '../../helpers/menu.js';
import { mute_input, unmute_input } from '../../helpers/input.js';
import header from '../../components/header.js';

export async function sshHostsScreen() {
  console.clear();
  header();
  mute_input();
  await menu('SSH Hosts', ['Back']);
  unmute_input();
}
