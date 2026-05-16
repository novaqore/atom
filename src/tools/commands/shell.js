import { spawn } from 'child_process';
import { system } from '../../utils/system_details.js';

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
    const child = spawn(args.command, { shell, timeout: 5000 });
    currentChild = child;
    let out = '';
    child.stdout.on('data', d => out += d.toString());
    child.stderr.on('data', d => out += d.toString());
    child.on('close', () => {
      currentChild = null;
      resolve(out.trim() ? out : '(no output)');
    });
    child.on('error', e => {
      currentChild = null;
      resolve(out.trim() ? out : (e.message || 'Command failed'));
    });
  });
}

export function abort() {
  if (currentChild) {
    currentChild.kill('SIGKILL');
    currentChild = null;
  }
}
