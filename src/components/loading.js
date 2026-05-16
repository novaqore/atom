import { colors } from '../utils/theme.js';

const FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

export class LoadingSpinner {
  #interval = null;
  #i = 0;
  #text;
  #color;
  #startTime = 0;

  constructor(text = 'Thinking...', color = 'cyan') {
    this.#text = text;
    this.#color = colors[color] || colors.cyan;
  }

  #elapsed() {
    const ms = Date.now() - this.#startTime;
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    return `${mins}m ${secs}s`;
  }

  #render() {
    const frame = FRAMES[this.#i = (this.#i + 1) % FRAMES.length];
    process.stdout.write(`\r\x1b[K${this.#color}${frame}${colors.reset} ${colors.white}${this.#text}${colors.reset} ${colors.grey}${this.#elapsed()}${colors.reset}`);
  }

  start() {
    if (this.#interval) return;
    this.#i = 0;
    this.#startTime = Date.now();
    process.stdout.write('\x1b[?25l');
    this.#render();
    this.#interval = setInterval(() => this.#render(), 80);
  }

  stop() {
    if (!this.#interval) return;
    clearInterval(this.#interval);
    this.#interval = null;
    process.stdout.write('\r\x1b[K\x1b[?25h');
  }
}
