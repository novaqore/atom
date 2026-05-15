import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default function header(baseUrl) {
    const packageJson = JSON.parse(readFileSync(join(__dirname, '../..', 'package.json'), 'utf8'));
    const version = packageJson.version || '0.0.0';

    const arch = os.arch();
    const platform = os.platform();
    const cpuCount = os.cpus().length;
    const totalMem = (os.totalmem() / (1024 ** 3)).toFixed(1);
    const homeDir = os.homedir();
    const shell = process.env.SHELL || process.env.COMSPEC || 'unknown'

    const info = [
        `\x1b[36mAtom v${version}\x1b[0m`,
        `${platform} (${arch})`,
        `${cpuCount} CPUs`,
        `${totalMem} GB RAM`,
        `Home: ${homeDir}`,
        `Shell: ${shell}`,
        baseUrl && `\x1b[33mAPI: ${baseUrl}\x1b[0m`,
    ].filter(Boolean).join('  •  ');

    console.log(`${info}`);
}