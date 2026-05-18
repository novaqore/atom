import readline from 'readline';
import { colors } from '../utils/theme.js';

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
