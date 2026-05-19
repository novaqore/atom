import { colors } from "./theme.js";
import { spinner } from "./spinner.js";

const CONTEXT_SIZE = 262144;

let total_in = 0;
let total_out = 0;

export function addTokens(chunk) {
  if (!chunk?.timings) return;
  total_in += chunk.timings.prompt_n || 0;
  total_out += chunk.timings.predicted_n || 0;
  const total = total_in + total_out;
  spinner.stop();
  process.stdout.write(`\r\n${colors.grey}[tokens] in: ${total_in}  out: ${total_out}  total: ${total}/${CONTEXT_SIZE}${colors.reset}\r\n`);
}

export function resetTokens() {
  total_in = 0;
  total_out = 0;
}

export function getTokenCounts() {
  return { in: total_in, out: total_out, total: total_in + total_out };
}

