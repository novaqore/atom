import os from 'os';
import { colors } from './theme.js';
import { loadEnv } from '../config/env.js';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const hideCursor = () => process.stdout.write('\x1b[?25l');
const showCursor = () => process.stdout.write('\x1b[?25h');
const home = '\x1b[H\x1b[2J';

const visibleLen = (s) => s.replace(/\x1b\[[0-9;]*m/g, '').length;
const padPlain = (s, w) => s + ' '.repeat(Math.max(0, w - s.length));
const centerIn = (line, w) =>
  ' '.repeat(Math.max(0, Math.floor((w - visibleLen(line)) / 2))) + line;
const truncate = (s, n = 22) => (s.length > n ? s.slice(0, n - 1) + '…' : s);

function paint(lines) {
  const cols = process.stdout.columns || 80;
  const rows = process.stdout.rows || 24;
  const width = Math.max(...lines.map(visibleLen));
  const left = ' '.repeat(Math.max(0, Math.floor((cols - width) / 2)));
  const top = Math.max(0, Math.floor((rows - lines.length) / 2) - 1);

  let out = home + '\n'.repeat(top);
  for (const line of lines) out += left + line + '\n';
  process.stdout.write(out);
}

const AW = 13;
const AH = 7;
const ACX = 6;
const ACY = 3;
const ORBITS = [
  { rx: 6, ry: 2, speed: 0.34, phase: 0, e: colors.brightCyan },
  { rx: 2.6, ry: 3, speed: -0.3, phase: 1.2, e: colors.brightBlue },
];

function atomLines(frame) {
  const grid = Array.from({ length: AH }, () => Array(AW).fill(null));
  const set = (x, y, ch, color, prio) => {
    const ix = Math.round(x);
    const iy = Math.round(y);
    if (ix < 0 || ix >= AW || iy < 0 || iy >= AH) return;
    const cur = grid[iy][ix];
    if (cur && cur.prio >= prio) return;
    grid[iy][ix] = { ch, color, prio };
  };

  for (const o of ORBITS) {
    for (let i = 0; i < 48; i++) {
      const t = (i / 48) * Math.PI * 2;
      set(ACX + o.rx * Math.cos(t), ACY + o.ry * Math.sin(t), '·', colors.dim + colors.cyan, 1);
    }
  }
  for (const o of ORBITS) {
    const t = frame * o.speed + o.phase;
    set(ACX + o.rx * Math.cos(t), ACY + o.ry * Math.sin(t), '●', colors.bold + o.e, 3);
  }
  const p = frame % 8;
  const nch = p < 4 ? '◉' : '●';
  const ncol = p < 2 ? colors.bold + colors.brightWhite
             : p < 4 ? colors.bold + colors.yellow
             : p < 6 ? colors.bold + colors.brightWhite
             : colors.bold + colors.brightCyan;
  set(ACX, ACY, nch, ncol, 5);

  return grid.map((row) => row.map((c) => (c ? c.color + c.ch + colors.reset : ' ')).join(''));
}

const WORDMARK = [
  ' █████╗ ████████╗ ██████╗ ███╗   ███╗',
  '██╔══██╗╚══██╔══╝██╔═══██╗████╗ ████║',
  '███████║   ██║   ██║   ██║██╔████╔██║',
  '██╔══██║   ██║   ██║   ██║██║╚██╔╝██║',
  '██║  ██║   ██║   ╚██████╔╝██║ ╚═╝ ██║',
  '╚═╝  ╚═╝   ╚═╝    ╚═════╝ ╚═╝     ╚═╝',
];
const WM_PALETTE = [
  colors.brightCyan, colors.brightCyan,
  colors.cyan, colors.cyan,
  colors.brightBlue, colors.brightBlue,
];
const WM_H = WORDMARK.length;
const WM_W = Math.max(...WORDMARK.map((l) => l.length));

const GAP = '   ';
const LOCK_W = AW + GAP.length + WM_W;

const tagline = `${colors.grey}a server agent in your shell${colors.reset}`;

let BOOT = [];

function buildBoot() {
  const env = loadEnv() || {};
  const model = env.MODEL || 'qwen3.6-27b';
  let who = 'agent';
  try {
    who = `${os.userInfo().username}@${os.hostname()}`;
  } catch {}
  const ram = (os.totalmem() / 1024 ** 3).toFixed(1);

  return [
    { label: 'system', detail: truncate(`${os.platform()} ${os.arch()}`), state: 'ok' },
    { label: 'cpus', detail: `${os.cpus().length} cores`, state: 'ok' },
    { label: 'memory', detail: `${ram} GB`, state: 'ok' },
    { label: 'model', detail: truncate(model), state: 'ok' },
    { label: 'host', detail: truncate(who), state: 'ok' },
  ];
}

function scene({
  frame = 0,
  reveal = 0,
  done = -1,
  spin = '◐',
  status = '',
} = {}) {
  const left = atomLines(frame);

  const top = Math.floor((AH - WM_H) / 2);
  const lock = left.map((lline, i) => {
    if (reveal <= 0) return lline;
    const wi = i - top;
    let right;
    if (wi >= 0 && wi < WM_H) {
      const clip = padPlain(WORDMARK[wi], WM_W).slice(0, reveal);
      right = WM_PALETTE[wi] + colors.bold + clip + colors.reset;
    } else {
      right = ' '.repeat(reveal);
    }
    return lline + GAP + right;
  });

  const blockW = reveal > 0 ? AW + GAP.length + reveal : AW;

  const footer = [reveal >= WM_W ? centerIn(`  ${tagline}`, blockW) : '', ''];
  for (let i = 0; i < BOOT.length; i++) {
    const { label, detail, state } = BOOT[i];
    const dots = '.'.repeat(Math.max(2, 16 - label.length));
    if (done < 0) footer.push('');
    else if (i < done) {
      const mark = state === 'fail'
        ? `${colors.red}✗${colors.reset}`
        : `${colors.green}✓${colors.reset}`;
      footer.push(centerIn(`${mark} ${colors.white}${label}${colors.reset} ${colors.grey}${dots} ${detail}${colors.reset}`, blockW));
    } else if (i === done)
      footer.push(centerIn(`${colors.brightCyan}${spin}${colors.reset} ${colors.white}${label}${colors.reset} ${colors.grey}${dots} ${detail}${colors.reset}`, blockW));
    else
      footer.push(centerIn(`${colors.grey}·  ${label}${colors.reset}`, blockW));
  }
  footer.push('', status ? centerIn(status, blockW) : '');

  return [...lock, '', ...footer];
}

export async function splash() {
  hideCursor();
  try {
    BOOT = buildBoot();

    let frame = 0;

    for (let i = 0; i < 14; i++) {
      paint(scene({ frame: frame++ }));
      await sleep(45);
    }

    for (let c = 0; c <= WM_W; c += 3) {
      paint(scene({ frame: frame++, reveal: c }));
      await sleep(22);
    }

    const spinner = ['◐', '◓', '◑', '◒'];
    for (let i = 0; i < BOOT.length; i++) {
      for (let s = 0; s < 3; s++) {
        paint(scene({ frame: frame++, reveal: WM_W, done: i, spin: spinner[s % 4] }));
        await sleep(70);
      }
    }

    paint(scene({
      frame: frame++,
      reveal: WM_W,
      done: BOOT.length,
      status: `${colors.green}●${colors.reset} ${colors.brightWhite}${colors.bold}ATOM online${colors.reset}`,
    }));
    await sleep(650);
  } finally {
    showCursor();
  }
}
