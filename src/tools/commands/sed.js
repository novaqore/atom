import { spawn } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { platform } from '../../system/details/os.js';
import { spinner } from '../../ui/spinner.js';
import { snapshot } from '../../config/file_backup.js';
import { colors } from '../../ui/theme.js';

export const definition = {
  type: "function",
  function: {
    name: "sed",
    description: `Edit a file in place using sed. Use this for targeted edits: substitutions, replacements, deletions, fixing typos, changing values on specific lines. For new files, full rewrites, or large content blocks, use the write tool instead.

Before each edit, the original file is snapshotted to .atom/bak/ with the full path mirrored and a timestamp suffix. Edits are recoverable.

Examples:
- Change a value on a specific line: pass line_num + pattern + replacement
- Replace all matches in a file: pass pattern + replacement only
- Fix a typo, update an import path, bump a version string

By default 'pattern' is treated as a literal string — regex metacharacters (. * [ ] \\) are escaped automatically, and the delimiter is auto-picked to avoid conflicts. Anchors are an exception: if pattern starts with ^ or ends with $, regex mode is enabled automatically so the anchors work as line anchors. Set regex: true to force regex mode for other BRE features, or regex: false to force literal mode (including literal ^/$).

Always prefer line_num when the same substring may appear elsewhere in the file — it scopes the edit and makes accidental over-matching impossible.

Sed is line-oriented: the pattern itself cannot span multiple lines (the replacement, however, may contain \\n and will insert new lines). For multi-line block matches, use the write tool.

If the pattern matches nothing the tool reports "no matches" and the file is left unchanged — re-check the exact text (literal mode is whitespace-, case-, and quote-sensitive) or try regex: true.`,
    parameters: {
      type: "object",
      properties: {
        file: { type: "string", description: "Path to the file to edit" },
        pattern: { type: "string", description: "Literal string to match (or sed BRE if regex: true)" },
        replacement: { type: "string", description: "Text to substitute in (literal — & and \\ are escaped automatically)" },
        line_num: { type: "integer", description: "Optional. Restrict edit to this single line number. Strongly recommended when the pattern is not unique in the file." },
        regex: { type: "boolean", description: "Optional. Force regex mode (true) or literal mode (false). If omitted, regex is auto-enabled when pattern starts with ^ or ends with $; otherwise literal." }
      },
      required: ["file", "pattern", "replacement"]
    }
  }
};

export const display = (args) => {
  const loc = args.line_num ? `:${args.line_num}` : '';
  return `${args.file}${loc} :: ${args.pattern} → ${args.replacement}`;
};


let currentChild = null;

function pickDelimiter(...strings) {
  const candidates = ['/', '|', '#', '@', '%', ',', ';', '!', '~', '\x01'];
  for (const c of candidates) {
    if (strings.every(s => !s.includes(c))) return c;
  }
  return '\x01';
}

function escapeBRE(s, delim) {
  let out = s.replace(/[\\.*[\]^$]/g, '\\$&');
  if (delim && delim !== '\x01') out = out.split(delim).join('\\' + delim);
  return out;
}

function escapeReplacement(s, delim) {
  let out = s.replace(/[\\&]/g, '\\$&');
  if (delim && delim !== '\x01') out = out.split(delim).join('\\' + delim);
  return out.replace(/\n/g, '\\\n');
}

function looksLikeRegex(pattern) {
  return pattern.startsWith('^') || (pattern.endsWith('$') && !pattern.endsWith('\\$'));
}

export async function run(args, working = false) {
  return new Promise((resolve) => {
    const { file, line_num } = args;
    const isRegex = args.regex === true
      || (args.regex !== false && looksLikeRegex(args.pattern));

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

    const delim = pickDelimiter(args.pattern, args.replacement);
    const pattern = isRegex ? args.pattern : escapeBRE(args.pattern, delim);
    const replacement = escapeReplacement(args.replacement, delim);
    const lineSpec = line_num ? `${line_num}` : '';
    const flags = line_num ? '' : 'g';
    const sedExpr = `${lineSpec}s${delim}${pattern}${delim}${replacement}${delim}${flags}`;

    let before;
    try {
      before = readFileSync(file);
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
      if (code !== 0) {
        let msg = out.trim() || `sed exited with code ${code}`;
        if (args.pattern.includes('\n')) {
          msg += ` — pattern contains a newline; sed cannot match across lines. Use the write tool for multi-line block edits.`;
        }
        finish(msg);
        return;
      }
      try {
        const after = readFileSync(file);
        if (before.equals(after)) {
          const hint = isRegex
            ? ` (regex mode was ${args.regex === true ? 'forced via regex: true' : 'auto-enabled because pattern uses anchors'})`
            : ` Set regex: true if the pattern needs sed BRE features.`;
          finish(`No matches for pattern in ${file} — file unchanged. Verify the exact text (whitespace, quotes, and case must match).${hint}`);
          return;
        }
      } catch {}
      finish(out.trim() || `Edited ${file}`);
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
