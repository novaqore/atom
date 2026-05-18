import os from 'os';
import path from 'path';
import { execSync } from 'child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'fs';

const safeExec = (cmd, fallback = 'not found') => {
  try { return execSync(cmd).toString().trim(); }
  catch { return fallback; }
};

const dirSize = (dir) => {
  if (!existsSync(dir)) return 0;
  let total = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) total += dirSize(full);
    else if (entry.isFile()) total += statSync(full).size;
  }
  return total;
};

const which = os.platform() === 'win32' ? 'where' : 'which';
const shellPath = process.env.SHELL || process.env.COMSPEC;

const parseSshConfig = () => {
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

export const system = {
  date: new Date().toISOString().split('T')[0],
  time: new Date().toLocaleTimeString(),
  type: os.type(),
  release: os.release(),
  platform: os.platform(),
  arch: os.arch(),
  username: os.userInfo().username,
  hostname: os.hostname(),
  homedir: os.homedir(),
  cwd: process.cwd(),
  cpuCount: os.cpus().length,
  totalMem: (os.totalmem() / (1024 ** 3)).toFixed(1),
  shell: shellPath || 'unknown',
  shellName: shellPath ? path.basename(shellPath, path.extname(shellPath)) : 'shell',
  node: {
    version: process.version,
    path: process.execPath,
  },
  npm: {
    version: safeExec('npm --version'),
    path: safeExec(`${which} npm`),
  },
  python: {
    version: safeExec('python3 --version || python --version'),
    path: safeExec(`${which} python3 || ${which} python`),
  },
  bakSize: dirSize('.atom/bak'),
  ssh_hosts: parseSshConfig(),
};
