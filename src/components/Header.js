import os from 'os';
import { colors } from '../utils/theme.js';
import { internalUrl } from '../lib/novaqore.js';
import { current, hasUpdate } from '../system/details/version.js';

export default function header() {
  const versionColor = hasUpdate ? colors.red : colors.white;
  const versionLabel = hasUpdate
    ? `${versionColor}v${current} update${colors.reset}`
    : `${versionColor}v${current}${colors.reset}`;

  const info = [
    `${colors.cyan}Atom${colors.reset} ${versionLabel}`,
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
