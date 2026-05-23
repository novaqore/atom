import { multiSelect } from '../navigation.js';
import { mute_input, unmute_input } from '../../ui/input.js';
import header from '../../ui/header.js';
import { colors } from '../../ui/theme.js';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { homedir } from 'os';
import path from 'path';

const sshConfigPath = path.join(homedir(), '.ssh', 'config');
const confPath = path.join(homedir(), '.atom', 'conf', '.ssh');

function parseSshConfig() {
  if (!existsSync(sshConfigPath)) return [];
  const hosts = [];
  let current = null;
  for (const line of readFileSync(sshConfigPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const match = trimmed.match(/^(\S+)\s+(.+)$/);
    if (!match) continue;
    const [, key, value] = match;
    if (key.toLowerCase() === 'host') {
      if (current && !current.alias.includes('*')) hosts.push(current);
      current = { alias: value, hostname: value, user: null, identityFile: null, port: null };
    } else if (current) {
      const k = key.toLowerCase();
      if (k === 'hostname') current.hostname = value;
      else if (k === 'user') current.user = value;
      else if (k === 'identityfile') current.identityFile = value;
      else if (k === 'port') current.port = value;
    }
  }
  if (current && !current.alias.includes('*')) hosts.push(current);
  return hosts;
}

function hostToCommand(h) {
  const parts = ['ssh'];
  if (h.identityFile) parts.push('-i', h.identityFile);
  if (h.port) parts.push('-p', h.port);
  parts.push(h.user ? `${h.user}@${h.hostname}` : h.hostname);
  return parts.join(' ');
}

function hostToConfLine(h) {
  return `${h.alias}: ${hostToCommand(h)}`;
}

function loadSelectedHosts() {
  if (!existsSync(confPath)) return [];
  return readFileSync(confPath, 'utf-8')
    .split('\n')
    .map(l => l.trim())
    .filter(l => l && !l.startsWith('#'));
}

function saveSelectedHosts(lines) {
  const dir = path.dirname(confPath);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(confPath, lines.length ? lines.join('\n') + '\n' : '');
}

export async function sshHostsScreen() {
  while (true) {
    console.clear();
    await header();

    const hosts = parseSshConfig();
    const selectedCommands = loadSelectedHosts();

    if (hosts.length === 0) {
      process.stdout.write(`  ${colors.grey}No hosts found in ~/.ssh/config${colors.reset}\n`);
      process.stdout.write(`  ${colors.grey}Press any key to go back${colors.reset}\n`);
      await new Promise(r => {
        const k = (_, key) => { process.stdin.off('keypress', k); r(); };
        process.stdin.on('keypress', k);
      });
      return;
    }

    const labels = hosts.map(h => `${h.alias} (${h.user}@${h.hostname})`);
    const displayOptions = [...labels, 'Back'];

    // Pre-select indices that match current conf
    const preSelected = new Set();
    labels.forEach((label, i) => {
      const confLine = hostToConfLine(hosts[i]);
      if (selectedCommands.includes(confLine)) preSelected.add(i);
    });

    // Callback fires on every space toggle — saves immediately
    const onToggle = (selectedIndices) => {
      const hostIndices = selectedIndices.filter(i => i < labels.length);
      const lines = hostIndices.map(i => hostToConfLine(hosts[i]));
      saveSelectedHosts(lines);
    };

    mute_input();
    const chosen = await multiSelect('SSH Hosts (toggle to expose to Atom)', displayOptions, preSelected, onToggle);
    unmute_input();

    if (chosen === null || chosen === '__BACK__') return;
  }
}
