import path from 'path';
import { existsSync, readdirSync, statSync } from 'fs';

const formatBytes = (b) => {
  if (b < 1024) return `${b}B`;
  if (b < 1024 ** 2) return `${(b / 1024).toFixed(1)}KB`;
  if (b < 1024 ** 3) return `${(b / 1024 ** 2).toFixed(1)}MB`;
  return `${(b / 1024 ** 3).toFixed(1)}GB`;
};

let cachedSize = null;

function dirSize(dir) {
  if (!existsSync(dir)) return 0;
  let total = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) total += dirSize(full);
    else if (entry.isFile()) total += statSync(full).size;
  }
  return total;
}

export function getBackupSize() {
  if (cachedSize === null) cachedSize = dirSize('.atom/bak');
  return formatBytes(cachedSize);
}

export function refreshBackupSize() {
  cachedSize = null;
}

export const prompt = `Access your file Backups: Every sed and write operation automatically writes a backup to your .atom/bak/ with the file's absolute path mirrored and a timestamp suffix. Editing /Users/x/y.txt creates .atom/bak/Users/x/y.txt.<timestamp>.bak.
Current backup folder size: ${getBackupSize()}
To recover a file, use the shell tool:
- List versions of a file: ls -lt .atom/bak\${ABS_PATH}.*.bak
- Restore the most recent: cp .atom/bak\${ABS_PATH}.<timestamp>.bak \${ABS_PATH}
Backups stack across every edit so older versions are also available.`;

