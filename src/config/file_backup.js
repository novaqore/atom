import { copyFileSync, mkdirSync, existsSync } from 'fs';
import path from 'path';

/**
 * Snapshot a file to .atom/bak/ before it's modified.
 * Mirrors the absolute path under .atom/bak/ with a timestamp suffix.
 */
export function snapshot(file) {
  const absFile = path.resolve(file);
  if (!existsSync(absFile)) return;
  const rel = absFile.startsWith('/') ? absFile.slice(1) : absFile;
  const backupPath = path.join(process.env.HOME, '.atom', 'bak', `${rel}.${Date.now()}.bak`);
  mkdirSync(path.dirname(backupPath), { recursive: true });
  copyFileSync(absFile, backupPath);
}

