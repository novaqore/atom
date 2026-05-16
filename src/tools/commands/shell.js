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

export async function run(args) {
  return new Promise((resolve) => {
    const child = spawn(args.command, { shell, timeout: 5000 });
    let out = '';
    child.stdout.on('data', d => out += d.toString());
    child.stderr.on('data', d => out += d.toString());
    child.on('close', () => resolve(out.trim() ? out : '(no output)'));
    child.on('error', e => resolve(out.trim() ? out : (e.message || 'Command failed')));
  });
}
