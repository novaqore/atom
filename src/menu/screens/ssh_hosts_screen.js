import { menu } from '../navigation.js';
import { mute_input, unmute_input } from '../../ui/input.js';
import header from '../../ui/header.js';

export async function sshHostsScreen() {
  console.clear();
  await header();
  mute_input();
  await menu('SSH Hosts', ['Back']);
  unmute_input();
}
