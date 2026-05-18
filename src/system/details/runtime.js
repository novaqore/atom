import os from 'os';
import { execSync } from 'child_process';

const safeExec = (cmd, fallback = 'not found') => {
  try { return execSync(cmd).toString().trim(); }
  catch { return fallback; }
};

const which = os.platform() === 'win32' ? 'where' : 'which';

const node = { version: process.version, path: process.execPath };
const npm = { version: safeExec('npm --version'), path: safeExec(`${which} npm`) };
const python = { version: safeExec('python3 --version || python --version'), path: safeExec(`${which} python3 || ${which} python`) };

export const prompt = `Node.js: ${node.version} / ${node.path}
NPM: ${npm.version} / ${npm.path}
Python: ${python.version} / ${python.path}`;
