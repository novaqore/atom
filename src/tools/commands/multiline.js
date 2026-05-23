import { existsSync, readFileSync, writeFileSync } from 'fs';
import { spinner } from '../../ui/spinner.js';
import { snapshot } from '../../config/file_backup.js';
import { colors } from '../../ui/theme.js';

export const definition = {
  type: "function",
  function: {
    name: "multiline",
    description: `Replace a multi-line block in a file. Use this when the edit spans multiple lines — replacing a function body, swapping a block of imports, inserting lines after a match, or deleting a range of lines.

Before each edit, the original file is snapshotted to .atom/bak/ with the full path mirrored and a timestamp suffix. Edits are recoverable.

Modes:
- range: Replace lines from start_line to end_line (inclusive) with replacement text. Pass start_line and end_line as integers.
- pattern: Replace from the first line matching start_pattern to the first line matching end_pattern (inclusive). Pass start_pattern and end_pattern as plain strings (substring match, not regex).

The replacement text can contain newlines — use actual newline characters in the string (the tool handles this natively, no \n escaping needed).

Examples:
- Replace lines 5-12: pass file, start_line: 5, end_line: 12, replacement: "new line 1\nnew line 2"
- Replace from "function foo" to "return x": pass file, start_pattern: "function foo", end_pattern: "return x", replacement: "new body"
- Delete lines 10-20: pass file, start_line: 10, end_line: 20, replacement: ""

If both range and pattern args are provided, range takes precedence.

Always prefer sed for single-line edits. Use multiline only when the edit genuinely spans multiple lines.`,
    parameters: {
      type: "object",
      properties: {
        file: { type: "string", description: "Path to the file to edit" },
        start_line: { type: "integer", description: "Optional. Start line number for range mode (1-based)." },
        end_line: { type: "integer", description: "Optional. End line number for range mode (1-based, inclusive)." },
        start_pattern: { type: "string", description: "Optional. Substring to match the start of the block." },
        end_pattern: { type: "string", description: "Optional. Substring to match the end of the block." },
        replacement: { type: "string", description: "Text to replace the matched block with. Use actual newlines for line breaks. Empty string deletes the block." }
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
  return `${args.file} :: [multiline] → ${args.replacement.slice(0, 60)}`;
};

export async function run(args, working = false) {
  const { file, replacement } = args;
  const isRange = args.start_line && args.end_line;

  const finish = (result) => {
    spinner.stop();
    process.stdout.write(`${colors.grey}${result}${colors.reset}\n`);
    if (working) spinner.start('Working...', 'yellow');
    return result;
  };

  if (!existsSync(file)) {
    return finish(`File not found: ${file}`);
  }

  if (!isRange && (!args.start_pattern || !args.end_pattern)) {
    return finish(`Must provide either (start_line + end_line) or (start_pattern + end_pattern).`);
  }

  let before;
  try {
    before = readFileSync(file);
    snapshot(file);
  } catch (e) {
    return finish(`Backup failed: ${e.message}`);
  }

  const content = before.toString();
  const lines = content.split('\n');
  let result;

  if (isRange) {
    const start = args.start_line;
    const end = args.end_line;
    if (start > end) {
      return finish(`start_line (${start}) must be <= end_line (${end}).`);
    }
    if (start < 1 || end > lines.length) {
      return finish(`Line range ${start}-${end} out of bounds (file has ${lines.length} lines).`);
    }
    const beforeLines = lines.slice(0, start - 1);
    const afterLines = lines.slice(end);
    const replacementLines = replacement === '' ? [] : replacement.split('\n');
    const newLines = [...beforeLines, ...replacementLines, ...afterLines];
    result = newLines.join('\n');
  } else {
    const startIdx = lines.findIndex(l => l.includes(args.start_pattern));
    if (startIdx === -1) {
      return finish(`Start pattern "${args.start_pattern}" not found in ${file}.`);
    }
    const endIdx = lines.slice(startIdx + 1).findIndex(l => l.includes(args.end_pattern));
    if (endIdx === -1) {
      // Check if start line itself also matches end pattern
      if (lines[startIdx].includes(args.end_pattern)) {
        const beforeLines = lines.slice(0, startIdx);
        const afterLines = lines.slice(startIdx + 1);
        const replacementLines = replacement === '' ? [] : replacement.split('\n');
        const newLines = [...beforeLines, ...replacementLines, ...afterLines];
        result = newLines.join('\n');
      } else {
        return finish(`End pattern "${args.end_pattern}" not found after start pattern in ${file}.`);
      }
    } else {
      const actualEnd = startIdx + 1 + endIdx;
      const beforeLines = lines.slice(0, startIdx);
      const afterLines = lines.slice(actualEnd + 1);
      const replacementLines = replacement === '' ? [] : replacement.split('\n');
      const newLines = [...beforeLines, ...replacementLines, ...afterLines];
      result = newLines.join('\n');
    }
  }

  try {
    writeFileSync(file, result);
    const after = readFileSync(file);
    if (before.equals(after)) {
      return finish(`No changes made to ${file} — replacement is identical to original block.`);
    }
  } catch (e) {
    return finish(`Write failed: ${e.message}`);
  }

  return finish(`Edited ${file}`);
}
