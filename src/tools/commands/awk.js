import { spawn } from 'child_process';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { platform } from '../../system/details/os.js';
import { spinner } from '../../ui/spinner.js';
import { snapshot } from '../../config/file_backup.js';
import { colors } from '../../ui/theme.js';

export const definition = {
  type: "function",
  function: {
    name: "awk",
    description: `Edit a multi-line block in a file using awk. Use this when the change spans multiple lines — replacing a function body, swapping a block of imports, inserting lines after a match, or deleting a range of lines.

Before each edit, the original file is snapshotted to .atom/bak/ with the full path mirrored and a timestamp suffix. Edits are recoverable.

Modes:
- range: Replace lines from start_line to end_line (inclusive) with replacement text. Pass start_line and end_line as integers.
- pattern: Replace from the first line matching start_pattern to the first line matching end_pattern (inclusive). Pass start_pattern and end_pattern as strings.

The replacement text can contain newlines (use \\n in the JSON string) and will be written as-is.

Examples:
- Replace lines 5-12: pass file, start_line: 5, end_line: 12, replacement: "new line 1\\nnew line 2"
- Replace from "function foo" to "return x": pass file, start_pattern: "function foo", end_pattern: "return x", replacement: "new body"
- Delete lines 10-20: pass file, start_line: 10, end_line: 20, replacement: ""

If both range and pattern args are provided, range takes precedence.

Always prefer sed for single-line edits. Use awk only when the edit genuinely spans multiple lines.`,
    parameters: {
      type: "object",
      properties: {
        file: { type: "string", description: "Path to the file to edit" },
        start_line: { type: "integer", description: "Optional. Start line number for range mode (1-based)." },
        end_line: { type: "integer", description: "Optional. End line number for range mode (1-based, inclusive)." },
        start_pattern: { type: "string", description: "Optional. Pattern to match the start of the block (awk regex)." },
        end_pattern: { type: "string", description: "Optional. Pattern to match the end of the block (awk regex)." },
        replacement: { type: "string", description: "Text to replace the matched block with. Use \\n for new lines. Empty string deletes the block." }
      },
      required: ["file", "replacement"]
    }
  }
};

export const display = (args) => {
  if (args.start_line && args.end_line) {
    return `${args.file}:${args.start_line}-${args.end_line} :: [range] → ${args.replacement.slice(0, 60)}${args.replacement.length > 60 ? '...' : ''}`;
  }
  if (args.start_pattern && args.end_pattern) {
    return `${args.file} :: [${args.start_pattern}..${args.end_pattern}] → ${args.replacement.slice(0, 60)}${args.replacement.length > 60 ? '...' : ''}`;
  }
  return `${args.file} :: [awk] → ${args.replacement.slice(0, 60)}`;
};

let currentChild = null;

function escapeAwk(s) {
  return s.replace(/\\/g, "\\\\").replace(/"/g, "\\\"");
}

export async function run(args, working = false) {
  return new Promise((resolve) => {
    const { file, replacement } = args;
    const isRange = args.start_line && args.end_line;

    const finish = (result) => {
      spinner.stop();
      process.stdout.write(`${colors.grey}${result}${colors.reset}\n`);
      if (working) spinner.start('Working...', 'yellow');
      resolve(result);
    };

    if (!existsSync(file)) {
      finish(`File not found: ${file}`);
      return;
    }

    if (!isRange && (!args.start_pattern || !args.end_pattern)) {
      finish(`Must provide either (start_line + end_line) or (start_pattern + end_pattern).`);
      return;
    }

    let before;
    try {
      before = readFileSync(file);
      snapshot(file);
    } catch (e) {
      finish(`Backup failed: ${e.message}`);
      return;
    }

    // Build awk script
    let awkScript;
    const escapedReplacement = escapeAwk(replacement);

    if (isRange) {
      const start = args.start_line;
      const end = args.end_line;
      if (start > end) {
        finish(`start_line (${start}) must be <= end_line (${end}).`);
        return;
      }
      awkScript = `
        NR == ${start}, NR == ${end} {
          if (NR == ${start}) print "${escapedReplacement}"
          next
        }
        { print }
      `;
    } else {
      const startPat = escapeAwk(args.start_pattern);
      const endPat = escapeAwk(args.end_pattern);
      awkScript = `
        BEGIN { found=0; replaced=0 }
        $0 ~ /${startPat}/ { found=1 }
        found && !replaced {
          if ($0 ~ /${endPat}/) {
            print "${escapedReplacement}"
            replaced=1
            found=0
            next
          }
          next
        }
        { print }
      `;
    }

    const child = spawn('awk', ['-e', awkScript, file], { stdio: 'pipe' });
    currentChild = child;
    let out = '';
    child.stdout.on('data', d => out += d.toString());
    child.stderr.on('data', d => out += d.toString());

    child.on('close', (code) => {
      currentChild = null;
      if (code !== 0) {
        let msg = out.trim() || `awk exited with code ${code}`;
        finish(msg);
        return;
      }

      try {
        writeFileSync(file, out);
        const after = readFileSync(file);
        if (before.equals(after)) {
          finish(`No changes made to ${file} — block may not have matched. Verify patterns or line numbers.`);
          return;
        }
      } catch (e) {
        finish(`Write failed: ${e.message}`);
        return;
      }

      finish(`Edited ${file}`);
    });

    child.on('error', e => {
      currentChild = null;
      finish(e.message || 'awk failed');
    });
  });
}

export function abort() {
  if (currentChild) {
    currentChild.kill('SIGKILL');
    currentChild = null;
  }
}
