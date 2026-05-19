import { colors } from "../utils/theme.js";

const BOLD_ON = '\x1b[1m';
const BOLD_OFF = '\x1b[22m';
const GRAY = colors.grey;
const WHITE = colors.white;
const CYAN = colors.cyan;
const YELLOW = colors.yellow;
const BLUE = colors.blue;

const LANG_COLORS = {
  python: BLUE, py: BLUE,
  javascript: YELLOW, js: YELLOW, jsx: YELLOW,
  typescript: YELLOW, ts: YELLOW, tsx: YELLOW,
  json: WHITE,
};

function colorForLang(lang) {
  return LANG_COLORS[(lang || '').toLowerCase()] || WHITE;
}

const EXT_COLORS = {
  py: BLUE,
  js: YELLOW, jsx: YELLOW, mjs: YELLOW, cjs: YELLOW,
  ts: CYAN, tsx: CYAN,
};

function colorForInline(text) {
  const m = text.match(/\.([a-zA-Z0-9]+)$/);
  if (m) {
    const c = EXT_COLORS[m[1].toLowerCase()];
    if (c) return c;
  }
  return CYAN;
}

/**
 * Streaming-safe markdown parser.
 * - Default prose is white.
 * - Inline `` `code` `` is cyan, `**bold**` is bold white.
 * - Line-start `- ` becomes a yellow dash; `### Heading` becomes bold white.
 * - "Key: value" lines (where Key is bold or ALL-CAPS) gray the value.
 * - Fenced code blocks are stripped of their fence lines and colored
 *   per language (py blue, js/ts yellow, json white).
 *
 * @param {string} fullText - Complete accumulated assistant text
 * @param {number} consumed - Raw chars already emitted in prior calls
 * @returns {{ output: string, consumed: number }}
 */
export function parseMarkdown(fullText, consumed = 0) {
  const safeEnd = findSafeEnd(fullText);
  if (safeEnd <= consumed) return { output: "", consumed };

  const slice = fullText.slice(consumed, safeEnd);
  const atLineStart = consumed === 0 || fullText[consumed - 1] === '\n';

  const lines = slice.split('\n');
  let inBlock = false;
  let blockColor = WHITE;
  const out = [];

  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx];
    const isStart = idx === 0 ? atLineStart : true;

    if (inBlock) {
      if (isStart && /^```/.test(line)) {
        inBlock = false;
        blockColor = WHITE;
      } else {
        out.push(`${blockColor}${line}${WHITE}`);
      }
      continue;
    }

    const fenceOpen = isStart && line.match(/^```([a-zA-Z0-9_+-]*)/);
    if (fenceOpen) {
      inBlock = true;
      blockColor = colorForLang(fenceOpen[1]);
      continue;
    }

    out.push(formatLine(line, isStart));
  }

  let output = out.join('\n');
  if (consumed === 0) output = `${WHITE}${output}`;
  return { output, consumed: safeEnd };
}

function formatLine(line, atLineStart) {
  if (atLineStart) {
    const heading = line.match(/^#{1,6} (.*)$/);
    if (heading) {
      return `${BOLD_ON}${WHITE}${heading[1]}${BOLD_OFF}`;
    }
    const bullet = line.match(/^( *)- (.*)$/);
    if (bullet) {
      return `${bullet[1]}${YELLOW}-${WHITE} ${formatKeyValue(bullet[2])}`;
    }
    const numbered = line.match(/^(\d+\.) (.*)$/);
    if (numbered) {
      return `${numbered[1]} ${formatKeyValue(numbered[2])}`;
    }
    return formatKeyValue(line);
  }
  return applyInline(line);
}

function formatKeyValue(text) {
  const kv = text.match(/^(.+?): (.*)$/);
  if (kv) {
    const [, key, value] = kv;
    const isBoldKey = /\*\*[^*]+\*\*/.test(key);
    const isCapsKey = /^[A-Z][A-Z0-9 _-]*$/.test(key);
    if (isBoldKey || isCapsKey) {
      return `${applyInline(key)}: ${GRAY}${applyInline(value, GRAY)}${WHITE}`;
    }
  }
  return applyInline(text);
}

function applyInline(text, base = WHITE) {
  return text
    .replace(/`([^`\n]+)`/g, (_, inner) => `${colorForInline(inner)}${inner}${base}`)
    .replace(/\*\*([^*]+?)\*\*/g, (_, inner) => `${BOLD_ON}${WHITE}${inner}${BOLD_OFF}${base}`);
}

function findSafeEnd(text) {
  let backtickOpen = -1;
  let boldOpen = -1;
  let inBlock = false;
  let blockOpenStart = -1;
  let i = 0;

  while (i < text.length) {
    const atLineStart = i === 0 || text[i - 1] === '\n';

    if (atLineStart && text.slice(i, i + 3) === '```') {
      const nl = text.indexOf('\n', i);
      if (nl === -1) {
        const candidates = [text.length, i];
        if (!inBlock && backtickOpen !== -1) candidates.push(backtickOpen);
        if (!inBlock && boldOpen !== -1) candidates.push(boldOpen);
        if (inBlock) candidates.push(blockOpenStart);
        return Math.min(...candidates);
      }
      if (!inBlock) {
        blockOpenStart = i;
        inBlock = true;
      } else {
        inBlock = false;
        blockOpenStart = -1;
      }
      backtickOpen = -1;
      boldOpen = -1;
      i = nl + 1;
      continue;
    }

    if (inBlock) {
      i++;
      continue;
    }

    if (text[i] === '*' && text[i + 1] === '*') {
      boldOpen = boldOpen === -1 ? i : -1;
      i += 2;
      continue;
    }
    if (text[i] === '`') {
      backtickOpen = backtickOpen === -1 ? i : -1;
      i += 1;
      continue;
    }
    i += 1;
  }

  let safeEnd = text.length;
  if (!inBlock) {
    if (backtickOpen !== -1) safeEnd = Math.min(safeEnd, backtickOpen);
    if (boldOpen !== -1) safeEnd = Math.min(safeEnd, boldOpen);
  } else {
    safeEnd = Math.min(safeEnd, blockOpenStart);
  }

  const lineStart = text.lastIndexOf('\n', safeEnd - 1) + 1;
  const tail = text.slice(lineStart, safeEnd);
  if (/^ *-?$/.test(tail) || /^#{1,6}/.test(tail) || /^`{1,2}$/.test(tail)) safeEnd = lineStart;

  return safeEnd;
}
