import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default function header() {
  const packageJson = JSON.parse(readFileSync(join(__dirname, '../..', 'package.json'), 'utf8'));
  const version = packageJson.version || '0.0.0';
  console.log(`Atom v${version}`);
}