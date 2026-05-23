import { existsSync, readFileSync } from 'fs';
import { homedir } from 'os';
import path from 'path';

const confPath = path.join(homedir(), '.atom', 'conf', '.env');

const parse = () => {
  if (!existsSync(confPath)) {
    // Fallback: all process.env keys
    const keys = Object.keys(process.env).sort();
    return keys.length ? keys.map(k => `- $${k}`).join('\n') : '- none';
  }
  const content = readFileSync(confPath, 'utf-8');
  const lines = content.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'));
  if (lines.length === 0) return '- none';
  return lines.map(key => {
    const val = process.env[key];
    return val != null ? `- $${key}=${'*'.repeat(val.length)}` : `- $${key}=<not set>`;
  }).join('\n');
};

const entries = parse();

export const prompt = `Available env vars (from .atom/conf/.env):
${entries}`;
