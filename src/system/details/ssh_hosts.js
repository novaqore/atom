import { existsSync, readFileSync } from 'fs';
import { homedir } from 'os';
import path from 'path';

const confPath = path.join(homedir(), '.atom', 'conf', '.ssh');

const parse = () => {
  if (!existsSync(confPath)) {
    return [];
  }
  const content = readFileSync(confPath, 'utf-8');
  return content.split('\n')
    .map(l => l.trim())
    .filter(l => l && !l.startsWith('#'));
};

const hosts = parse();

export const prompt = `The SSH hosts you control:
${hosts.length ? hosts.map(h => `- ${h}`).join('\n') : '- none configured'}`;
