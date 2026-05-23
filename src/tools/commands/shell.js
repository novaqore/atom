import { spawn } from 'child_process';
import { shell, shellName } from '../../system/details/shell.js';
import { resolveEnvVars } from '../../system/details/env_keys.js';
import { spinner } from '../../ui/spinner.js';
import { colors } from '../../ui/theme.js';
import { rl } from '../../ui/input.js';

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

export async function run(args, working = false) {
  return new Promise((resolve) => {
    rl.pause();
    if (process.stdin.isTTY) process.stdin.setRawMode(false);

    const resolvedEnv = resolveEnvVars();
    const env = { ...process.env, ...resolvedEnv };
    const child = spawn(args.command, { shell, stdio: ['inherit', 'pipe', 'pipe'], env });
    currentChild = child;
    let out = '';

    const onData = (d) => {
      spinner.stop();
      const text = d.toString();
      out += text;
      process.stdout.write(`${colors.green}${text}${colors.reset}`);
    };

    child.stdout.on('data', onData);
    child.stderr.on('data', (d) => {
      spinner.stop();
      const text = d.toString();
      out += text;
      process.stdout.write(`${colors.red}${text}${colors.reset}`);
    });

    const finish = (fallback) => {
      currentChild = null;
      spinner.stop();
      if (process.stdin.isTTY) process.stdin.setRawMode(true);
      rl.resume();
      if (out && !out.endsWith('\n')) process.stdout.write('\n');
      if (!out.trim()) process.stdout.write(`${colors.green}${fallback}${colors.reset}\n`);
      if (working) spinner.start('Working...', 'yellow');
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
