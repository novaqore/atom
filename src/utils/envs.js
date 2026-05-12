import fs from 'fs';
import path from 'path';
import { homedir } from 'os';

const atomDir = path.join(homedir(), '.atom');
const envPath = path.join(atomDir, '.env');

export function loadEnv() {
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8');
    const env = {};
    content.split('\n').forEach(line => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        env[match[1].trim()] = match[2].trim();
      }
    });
    return env;
  }
  return null;
}

export function saveEnv(env) {
  if (!fs.existsSync(atomDir)) {
    fs.mkdirSync(atomDir, { recursive: true });
  }
  const content = Object.entries(env)
    .map(([k, v]) => `${k}=${v}`)
    .join('\n') + '\n';
  fs.writeFileSync(envPath, content);
}