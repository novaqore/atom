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