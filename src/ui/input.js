import readline from 'readline';
import { colors } from "./theme.js";

let _rl = null;
let _origWrite = null;

function ensureRl() {
  if (!_rl) {
    _rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true,
    });
    _origWrite = _rl._ttyWrite.bind(_rl);
  }
  return _rl;
}

export const rl = {
  [Symbol.asyncIterator]() {
    return ensureRl()[Symbol.asyncIterator]();
  },
  on(...args) { return ensureRl().on(...args); },
  off(...args) { return ensureRl().off(...args); },
  close() { return ensureRl().close(); },
  pause() { return ensureRl().pause(); },
  resume() { return ensureRl().resume(); },
  setPrompt(p) { return ensureRl().setPrompt(p); },
  prompt(preserveCursor) { return ensureRl().prompt(preserveCursor); },
  question(query, cb) { return ensureRl().question(query, cb); },
};

export function mute_input() {
  if (_rl) _rl._ttyWrite = () => {};
}
export function unmute_input() {
  if (_rl && _origWrite) _rl._ttyWrite = _origWrite;
}

export function prompt(question) {
  return new Promise((resolve) => {
    let escaped = false;
    const onKey = (_, key) => {
      if (key?.name === 'escape' && !escaped) {
        escaped = true;
        process.stdin.emit('keypress', '\r', { name: 'return', sequence: '\r' });
      }
    };
    process.stdin.on('keypress', onKey);
    rl.question(`${question} `, (answer) => {
      process.stdin.off('keypress', onKey);
      resolve(escaped ? null : answer.trim());
    });
  });
}

export function user_input() {
  const width = process.stdout.columns || 80;
  process.stdout.write(`${colors.grey}${'─'.repeat(width)}${colors.reset}`);
  process.stdout.write(`${colors.grey}> `);
}

