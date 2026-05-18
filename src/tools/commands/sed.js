import { spawn } from 'child_process';
import { copyFileSync, mkdirSync, existsSync } from 'fs';
import path from 'path';
import { platform } from '../../system/details/os.js';
import { spinner } from '../../components/spinner.js';
import { colors } from '../../utils/theme.js';

export const definition = {
  type: "function",
  function: {
    name: "sed",
    description: `Edit a file in place using sed. Prefer this tool for ANY targeted file edit (substitutions, replacements, deletions). Do NOT rewrite a whole file when sed can do the edit.

Before each edit, the original file is snapshotted to .atom/bak/ with the full path mirrored and a timestamp suffix. Edits are recoverable.

Examples:
- Change a value on a specific line: pass line_num + pattern + replacement
- Replace all matches in a file: pass pattern + replacement only
- Fix a typo, update an import path, bump a version string

Pattern is a sed regex. If pattern or replacement contains '/', set delimiter to a safe char like '|' or '#'.`,
    parameters: {
      type: "object",
      properties: {
        file: { type: "string", description: "Path to the file to edit" },
        pattern: { type: "string", description: "Sed regex pattern to match" },
        replacement: { type: "string", description: "Text to substitute in" },
        line_num: { type: "integer", description: "Optional. Restrict edit to this single line number." },
        delimiter: { type: "string", description: "Optional. Defaults to '/'. Use a different char if pattern or replacement contains /." }
      },
      required: ["file", "pattern", "replacement"]
    }
  }
};

export const display = (args) => {
  const loc = args.line_num ? `:${args.line_num}` : '';
  return `${args.file}${loc} :: ${args.pattern} → ${args.replacement}`;
};

function snapshot(file) {
  const absFile = path.resolve(file);
  if (!existsSync(absFile)) return;
  const rel = absFile.startsWith('/') ? absFile.slice(1) : absFile;
  const backupPath = path.join('.atom', 'bak', `${rel}.${Date.now()}.bak`);
  mkdirSync(path.dirname(backupPath), { recursive: true });
  copyFileSync(absFile, backupPath);
}

let currentChild = null;

export async function run(args, working = false) {
  return new Promise((resolve) => {
    const { file, pattern, replacement, line_num } = args;
    const delim = args.delimiter || '/';
    const lineSpec = line_num ? `${line_num}` : '';
    const flags = line_num ? '' : 'g';
    const sedExpr = `${lineSpec}s${delim}${pattern}${delim}${replacement}${delim}${flags}`;

    const finish = (result) => {
      spinner.stop();
      process.stdout.write(`${colors.grey}${result}${colors.reset}\n`);
      if (working) spinner.start('Working...', 'yellow');
      resolve(result);
    };

    try {
      snapshot(file);
    } catch (e) {
      finish(`Backup failed: ${e.message}`);
      return;
    }

    const isMac = platform === 'darwin';
    const sedArgs = isMac ? ['-i', '', sedExpr, file] : ['-i', sedExpr, file];

    const child = spawn('sed', sedArgs, { stdio: 'pipe' });
    currentChild = child;
    let out = '';
    child.stdout.on('data', d => out += d.toString());
    child.stderr.on('data', d => out += d.toString());

    child.on('close', (code) => {
      currentChild = null;
      finish(code !== 0 ? (out.trim() || `sed exited with code ${code}`) : (out.trim() || `Edited ${file}`));
    });
    child.on('error', e => {
      currentChild = null;
      finish(e.message || 'sed failed');
    });
  });
}

export function abort() {
  if (currentChild) {
    currentChild.kill('SIGKILL');
    currentChild = null;
  }
}
