import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(join(__dirname, '../../..', 'package.json'), 'utf-8'));

export const current = pkg.version;
export let latest = null;
export let hasUpdate = false;
let checked = false;

export async function checkUpdate() {
  if (checked) return;
  checked = true;
  try {
    const res = await fetch(`https://registry.npmjs.org/${pkg.name}/latest`, {
      signal: AbortSignal.timeout(1500),
    });
    if (res.ok) {
      const data = await res.json();
      latest = data.version;
      hasUpdate = !!latest && latest !== current;
    }
  } catch {
    // silent fail - no update info
  }
}

export function getVersionPrompt() {
  if (hasUpdate) {
    return `Atom version: ${current} (a newer version ${latest} is available; tell the user to update with: npm install -g @novaqore/atom)`;
  }
  return `Atom version: ${current} (latest)`;
}

