import { multiSelect } from '../navigation.js';
import { mute_input, unmute_input } from '../../ui/input.js';
import header from '../../ui/header.js';
import { colors } from '../../ui/theme.js';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { homedir } from 'os';
import path from 'path';

const confPath = path.join(homedir(), '.atom', 'conf', '.env');

function loadSelectedKeys() {
  if (!existsSync(confPath)) return [];
  return readFileSync(confPath, 'utf-8')
    .split('\n')
    .map(l => l.trim())
    .filter(l => l && !l.startsWith('#'));
}

function saveSelectedKeys(keys) {
  const dir = path.dirname(confPath);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(confPath, keys.length ? keys.join('\n') + '\n' : '');
}

export async function envScreen() {
  while (true) {
    console.clear();
    await header();

    const allKeys = Object.keys(process.env).sort();
    const selectedKeys = loadSelectedKeys();

    if (allKeys.length === 0) {
      process.stdout.write(`  ${colors.grey}No environment variables found.${colors.reset}\n`);
      process.stdout.write(`  ${colors.grey}Press any key to go back${colors.reset}\n`);
      await new Promise(r => {
        const k = (_, key) => { process.stdin.off('keypress', k); r(); };
        process.stdin.on('keypress', k);
      });
      return;
    }

    const displayOptions = [...allKeys, 'Back'];

    // Pre-select indices that match current conf
    const preSelected = new Set();
    allKeys.forEach((key, i) => {
      if (selectedKeys.includes(key)) preSelected.add(i);
    });

    // Callback fires on every space toggle — saves immediately
    const onToggle = (selectedIndices) => {
      const keyIndices = selectedIndices.filter(i => i < allKeys.length);
      const keys = keyIndices.map(i => allKeys[i]);
      saveSelectedKeys(keys);
    };

    mute_input();
    const chosen = await multiSelect('Environment Variables (toggle to expose to Atom)', displayOptions, preSelected, onToggle);
    unmute_input();

    if (chosen === null || chosen === '__BACK__') return;
  }
}
