import { execSync } from 'child_process';
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
  try {
    const out = execSync(args.command, { encoding: 'utf8', timeout: 5000, stdio: 'pipe', shell });
    return out.trim() ? out : '(no output)';
  } catch (err) {
    const out = err.stderr || err.stdout || err.message || 'Command failed';
    return out.trim() ? out : '(no output)';
  }
}
