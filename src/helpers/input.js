import readline from 'readline';
import { colors } from '../utils/theme.js';

export const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: true,
});

const orig = rl._ttyWrite.bind(rl);

export function mute_input() { rl._ttyWrite = () => {}; }
export function unmute_input() { rl._ttyWrite = orig; }

export function user_input() {
  const width = process.stdout.columns || 80;
  process.stdout.write(`${colors.grey}${'─'.repeat(width)}${colors.reset}`);
  process.stdout.write(`${colors.grey}> `);
}
