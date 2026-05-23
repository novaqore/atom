import { existsSync, readFileSync } from 'fs';
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

function parseValueFromFile(filePath, key) {
  if (!existsSync(filePath)) return null;
  try {
    const content = readFileSync(filePath, 'utf-8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (trimmed.startsWith('#') || !trimmed) continue;
      const match = trimmed.match(/^export\s+([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
      if (match && match[1] === key) {
        let val = match[2].trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        return val;
      }
    }
  } catch { /* skip */ }
  return null;
}

export function resolveEnvVars() {
  const resolved = {};
  if (!existsSync(confPath)) return resolved;
  
  const content = readFileSync(confPath, 'utf-8');
  const lines = content.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'));
  
  for (const line of lines) {
    const eqIndex = line.indexOf('=');
    if (eqIndex === -1) continue;
    
    const key = line.slice(0, eqIndex);
    const source = line.slice(eqIndex + 1);
    
    let value;
    if (source === 'process.env') {
      value = process.env[key];
    } else if (source.startsWith('/')) {
      value = parseValueFromFile(source, key);
    }
    
    if (value !== null && value !== undefined) {
      resolved[key] = value;
    }
  }
  
  return resolved;
}

const parse = () => {
  if (!existsSync(confPath)) {
    return '- none';
  }
  const content = readFileSync(confPath, 'utf-8');
  const lines = content.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'));
  if (lines.length === 0) return '- none';
  
  const keys = lines.map(line => {
    const eqIndex = line.indexOf('=');
    if (eqIndex !== -1) {
      return line.slice(0, eqIndex);
    }
    return line;
  });
  
  return keys.map(k => `- $${k}`).join('\n');
};

const entries = parse();

export const prompt = `Available env vars:
${entries}`;