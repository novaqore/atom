import { multiSelect } from '../navigation.js';
import { mute_input, unmute_input } from '../../ui/input.js';
import header from '../../ui/header.js';
import { colors } from '../../ui/theme.js';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { homedir } from 'os';
import path from 'path';

const confPath = path.join(homedir(), '.atom', 'conf', '.env');

const SHELL_CONFIGS = [
  '.bashrc',
  '.bash_profile',
  '.profile',
  '.zshrc',
  '.zprofile',
  '.zshenv',
];

function parseExportsFromFiles() {
  const map = new Map();
  const home = homedir();
  for (const file of SHELL_CONFIGS) {
    const filePath = path.join(home, file);
    if (!existsSync(filePath)) continue;
    try {
      const content = readFileSync(filePath, 'utf-8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (trimmed.startsWith('#') || !trimmed) continue;
        const match = trimmed.match(/^export\s+([A-Za-z_][A-Za-z0-9_]*)/);
        if (match) {
          const key = match[1];
          if (!map.has(key)) {
            map.set(key, filePath);
          }
        }
      }
    } catch { /* skip unreadable files */ }
  }
  return map;
}

function loadSelectedKeys() {
  if (!existsSync(confPath)) return new Map();
  const map = new Map();
  readFileSync(confPath, 'utf-8')
    .split('\n')
    .map(l => l.trim())
    .filter(l => l && !l.startsWith('#'))
    .forEach(line => {
      const eqIndex = line.indexOf('=');
      if (eqIndex !== -1) {
        const key = line.slice(0, eqIndex);
        const source = line.slice(eqIndex + 1);
        map.set(key, source);
      }
    });
  return map;
}

function saveSelectedKeys(entries) {
  const dir = path.dirname(confPath);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  const lines = [...entries].map(([k, v]) => `${k}=${v}`);
  writeFileSync(confPath, lines.length ? lines.join('\n') + '\n' : '');
}

export async function envScreen() {
  while (true) {
    console.clear();
    await header();

    const fileSources = parseExportsFromFiles();
    const envKeys = new Set(Object.keys(process.env));
    const allKeysSet = new Set([...fileSources.keys(), ...envKeys]);
    const allKeys = [...allKeysSet].sort();
    const selectedEntries = loadSelectedKeys();

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

    const preSelected = new Set();
    allKeys.forEach((key, i) => {
      if (selectedEntries.has(key)) preSelected.add(i);
    });

    const onToggle = (selectedIndices) => {
      const keyIndices = selectedIndices.filter(i => i < allKeys.length);
      const entries = new Map();
      keyIndices.forEach(i => {
        const key = allKeys[i];
        let source;
        if (fileSources.has(key)) {
          source = fileSources.get(key);
        } else if (envKeys.has(key)) {
          source = 'process.env';
        } else {
          source = 'unknown';
        }
        entries.set(key, source);
      });
      saveSelectedKeys(entries);
    };

    mute_input();
    const chosen = await multiSelect('Environment Variables (toggle to expose to Atom)', displayOptions, preSelected, onToggle);
    unmute_input();

    if (chosen === null || chosen === '__BACK__') return;
  }
}
