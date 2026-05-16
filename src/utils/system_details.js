import os from 'os';
import path from 'path';
import { execSync } from 'child_process';

const safeExec = (cmd, fallback = 'not found') => {
  try { return execSync(cmd).toString().trim(); }
  catch { return fallback; }
};

const which = os.platform() === 'win32' ? 'where' : 'which';
const shellPath = process.env.SHELL || process.env.COMSPEC;

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
};
