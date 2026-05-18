import os from 'os';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { colors } from '../utils/theme.js';
import { internalUrl } from '../lib/novaqore.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default function header() {
  const packageJson = JSON.parse(readFileSync(join(__dirname, '../..', 'package.json'), 'utf8'));
  const version = packageJson.version || '0.0.0';

  const info = [
    `${colors.cyan}Atom${colors.reset} ${colors.white}v${version}${colors.reset}`,
    `${os.platform()} (${os.arch()})`,
    `CPUs: ${os.cpus().length}`,
    `RAM: ${(os.totalmem() / (1024 ** 3)).toFixed(1)}GB`,
    `Home: ${os.homedir()}`,
    `Shell: ${process.env.SHELL || process.env.COMSPEC || 'unknown'}`,
    internalUrl && `${colors.yellow}Local:${colors.reset} ${colors.white}${internalUrl}${colors.reset}`,
  ].filter(Boolean).join('  •  ');

  const width = process.stdout.columns || 80;
  process.stdout.write(`${info}\n`);
  process.stdout.write(`${colors.grey}${'─'.repeat(width)}${colors.reset}\n`);
}
