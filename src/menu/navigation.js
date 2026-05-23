import readline from 'readline';
import { colors } from '../ui/theme.js';

export function menu(question, options) {
  return new Promise((resolve) => {
    readline.emitKeypressEvents(process.stdin);
    if (process.stdin.isTTY) process.stdin.setRawMode(true);

    let selected = 0;
    let drawn = false;

    const draw = () => {
      if (drawn) process.stdout.write(`\x1b[${options.length}A`);
      options.forEach((opt, i) => {
        const isSel = i === selected;
        const isBack = opt === 'Back';
        const color = isSel ? colors.cyan : colors.grey;
        const marker = isBack
          ? `${color}←${colors.reset}`
          : (isSel ? `${colors.cyan}▶${colors.reset}` : ' ');
        const text = `${color}${opt}${colors.reset}`;
        process.stdout.write(`\x1b[2K\r${marker} ${text}\n`);
      });
      drawn = true;
    };

    process.stdout.write('\x1b[?25l');
    process.stdout.write(`${question}\n`);
    draw();

    const onKey = (_, key) => {
      if (!key) return;
      if (key.name === 'up') {
        selected = (selected - 1 + options.length) % options.length;
        draw();
      } else if (key.name === 'down') {
        selected = (selected + 1) % options.length;
        draw();
      } else if (key.name === 'return') {
        process.stdin.off('keypress', onKey);
        process.stdout.write('\x1b[?25h');
        resolve(options[selected]);
      } else if (key.name === 'escape' || (key.ctrl && key.name === 'c')) {
        process.stdin.off('keypress', onKey);
        process.stdout.write('\x1b[?25h');
        resolve(null);
      }
    };
    process.stdin.on('keypress', onKey);
  });
}

export function multiSelect(question, options, preSelected = new Set(), onToggle = null) {
  return new Promise((resolve) => {
    readline.emitKeypressEvents(process.stdin);
    if (process.stdin.isTTY) process.stdin.setRawMode(true);

    let cursor = 0;
    const selected = new Set(preSelected);
    let drawn = false;

    const isBackItem = (opt) => opt === 'Back';

    const draw = () => {
      if (drawn) process.stdout.write(`\x1b[${options.length}A`);
      options.forEach((opt, i) => {
        const isCursor = i === cursor;
        const isSelected = selected.has(i);
        const isBack = isBackItem(opt);
        const color = isCursor ? colors.cyan : colors.grey;
        const marker = isBack
          ? `${color}←${colors.reset}`
          : (isCursor ? `${colors.cyan}▶${colors.reset}` : ' ');
        const check = isBack
          ? '  '
          : (isSelected ? `${colors.green}[+]${colors.reset}` : `${colors.grey}[ ]${colors.reset}`);
        const text = `${color}${opt}${colors.reset}`;
        process.stdout.write(`\x1b[2K\r${marker} ${check} ${text}\n`);
      });
      drawn = true;
    };

    process.stdout.write('\x1b[?25l');
    process.stdout.write(`${question}\n`);
    process.stdout.write(`${colors.grey}Space: toggle  Enter on Back: exit  Esc: back${colors.reset}\n`);
    draw();

    const onKey = (_, key) => {
      if (!key) return;
      if (key.name === 'up') {
        cursor = (cursor - 1 + options.length) % options.length;
        draw();
      } else if (key.name === 'down') {
        cursor = (cursor + 1) % options.length;
        draw();
      } else if (key.name === 'space') {
        if (isBackItem(options[cursor])) return;
        if (selected.has(cursor)) selected.delete(cursor);
        else selected.add(cursor);
        if (onToggle) onToggle([...selected].sort((a, b) => a - b));
        draw();
      } else if (key.name === 'return') {
        process.stdin.off('keypress', onKey);
        process.stdout.write('\x1b[?25h');
        // If cursor is on "Back", resolve with special sentinel
        if (isBackItem(options[cursor])) {
          resolve('__BACK__');
        } else {
          resolve([...selected].sort((a, b) => a - b).map(i => options[i]));
        }
      } else if (key.name === 'escape' || (key.ctrl && key.name === 'c')) {
        process.stdin.off('keypress', onKey);
        process.stdout.write('\x1b[?25h');
        resolve(null);
      }
    };
    process.stdin.on('keypress', onKey);
  });
}
