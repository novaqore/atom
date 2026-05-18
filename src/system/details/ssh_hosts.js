import os from 'os';
import path from 'path';
import { existsSync, readFileSync } from 'fs';

const parse = () => {
  const configPath = path.join(os.homedir(), '.ssh', 'config');
  if (!existsSync(configPath)) return [];
  try {
    const hosts = [];
    let current = null;
    for (const line of readFileSync(configPath, 'utf8').split('\n')) {
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
    return hosts.map(h => {
      const parts = ['ssh'];
      if (h.identityFile) parts.push('-i', h.identityFile);
      if (h.port) parts.push('-p', h.port);
      parts.push(h.user ? `${h.user}@${h.hostname}` : h.hostname);
      return `${h.alias}: ${parts.join(' ')}`;
    });
  } catch {
    return [];
  }
};

const hosts = parse();

export const prompt = `The SSH hosts you control:
${hosts.length ? hosts.map(h => `- ${h}`).join('\n') : '- none configured'}`;
