import fs from 'fs';
import path from 'path';
import { homedir } from 'os';

const envPath = path.join(homedir(), '.atom', '.env');

export function loadEnv() {
  if (!fs.existsSync(envPath)) return null;
  const content = fs.readFileSync(envPath, 'utf-8');
  const env = {};
  content.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) env[match[1].trim()] = match[2].trim();
  });
  return env;
}

export function saveEnv(env) {
  const dir = path.dirname(envPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const content = Object.entries(env).map(([k, v]) => `${k}=${v}`).join('\n') + '\n';
  fs.writeFileSync(envPath, content);
}

function shellEnvFile() {
  const shell = process.env.SHELL || '';
  if (shell.includes('zsh')) return path.join(homedir(), '.zshenv');
  if (shell.includes('bash')) return path.join(homedir(), '.bashrc');
  return null;
}

export function saveToShellEnv(key, value) {
  const file = shellEnvFile();
  if (!file) return false;
  let content = fs.existsSync(file) ? fs.readFileSync(file, 'utf-8') : '';
  const line = `export ${key}=${value}`;
  const pattern = new RegExp(`^export ${key}=.*$`, 'm');
  content = pattern.test(content)
    ? content.replace(pattern, line)
    : content.replace(/\n*$/, '') + `\n${line}\n`;
  fs.writeFileSync(file, content);
  process.env[key] = value;
  return true;
}
