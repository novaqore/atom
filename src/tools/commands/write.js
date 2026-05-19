import { writeFileSync } from 'fs';
import path from 'path';
import { spinner } from '../../ui/spinner.js';
import { snapshot } from '../../config/file_backup.js';
import { colors } from '../../ui/theme.js';

export const definition = {
  type: "function",
  function: {
    name: "write",
    description: `Write content to a file, creating it or overwriting it entirely. Use this for new files, full rewrites, or when the content is too large for sed.

Before writing, if the file already exists, the original is snapshotted to .atom/bak/ with the full path mirrored and a timestamp suffix. Writes are recoverable.

Examples:
- Create a new config file from scratch
- Rewrite an entire file with new content
- Write a multi-line template or generated code

Use sed for targeted edits (changing a line, fixing a typo, replacing a value).
Use write for full file content (new files, complete rewrites, large blocks).`,
    parameters: {
      type: "object",
      properties: {
        file: { type: "string", description: "Path to the file to write to" },
        content: { type: "string", description: "The full content to write to the file" }
      },
      required: ["file", "content"]
    }
  }
};

export const display = (args) => {
  const lines = args.content.split('\n').length;
  return `${args.file} (${lines} lines)`;
};


export async function run(args, working = false) {
  return new Promise((resolve) => {
    const { file, content } = args;
    const absFile = path.resolve(file);

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

    try {
      mkdirSync(path.dirname(absFile), { recursive: true });
      writeFileSync(absFile, content);
      const lines = content.split('\n').length;
      finish(`Wrote ${lines} lines to ${file}`);
    } catch (e) {
      finish(`Write failed: ${e.message}`);
    }
  });
}
