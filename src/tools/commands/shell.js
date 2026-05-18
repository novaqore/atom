import { spawn } from 'child_process';
import { system } from '../../utils/system_details.js';
import { spinner } from '../../components/spinner.js';
import { colors } from '../../utils/theme.js';
import { rl } from '../../helpers/input.js';

const { shell, shellName } = system;

export const definition = {
  type: "function",
  function: {
    name: shellName,
    description: `Execute commands using ${shellName} located at (${shell}).`,
    parameters: {
      type: "object",
      properties: {
        command: {
          type: "string",
          description: "The command to execute"
        }
      },
      required: ["command"]
    }
  }
};

export const display = (args) => args.command;

let currentChild = null;

export async function run(args) {
  return new Promise((resolve) => {
    spinner.stop();
    rl.pause();
    process.stdin.pause();
    if (process.stdin.isTTY) process.stdin.setRawMode(false);

    const child = spawn(args.command, { shell, stdio: ['inherit', 'pipe', 'pipe'] });
    currentChild = child;
    let out = '';

    const onData = (d) => {
      const text = d.toString();
      out += text;
      process.stdout.write(`${colors.green}${text}${colors.reset}`);
    };

    child.stdout.on('data', onData);
    child.stderr.on('data', onData);

    const finish = (fallback) => {
      currentChild = null;
      if (process.stdin.isTTY) process.stdin.setRawMode(true);
      process.stdin.resume();
      rl.resume();
      if (out && !out.endsWith('\n')) process.stdout.write('\n');
      if (!out.trim()) process.stdout.write(`${colors.green}${fallback}${colors.reset}\n`);
      resolve(out.trim() ? out : fallback);
    };

    child.on('close', () => finish('(no output)'));
    child.on('error', (e) => finish(e.message || 'Command failed'));
  });
}

export function abort() {
  if (currentChild) {
    currentChild.kill('SIGKILL');
    currentChild = null;
  }
}
