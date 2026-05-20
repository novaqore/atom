import os from 'os';
import { colors } from "./theme.js";
import { url } from '../lib/novaqore.js';
import { current, checkUpdate } from '../system/details/version.js';

export default async function header() {

  checkUpdate().catch(() => {});

  const info = [
    `${colors.cyan}Atom${colors.reset} ${colors.white}v${current}${colors.reset}`,
    `${os.platform()} (${os.arch()})`,
    `CPUs: ${os.cpus().length}`,
    `RAM: ${(os.totalmem() / (1024 ** 3)).toFixed(1)}GB`,
    `Home: ${os.homedir()}`,
    `Shell: ${process.env.SHELL || process.env.COMSPEC || 'unknown'}`,
    url && `${colors.yellow}Local:${colors.reset} ${colors.white}${url}${colors.reset}`,
  ].filter(Boolean).join('  •  ');

  const width = process.stdout.columns || 80;
  process.stdout.write(`${info}\n`);
  process.stdout.write(`${colors.grey}${'─'.repeat(width)}${colors.reset}\n`);
}

