import { colors } from "./theme.js";

const CONTEXT_SIZE = 262144;

let total_in = 0;
let total_out = 0;

export function addTokens(chunk) {
  if (!chunk?.timings) return;
  total_in += chunk.timings.prompt_n || 0;
  total_out += chunk.timings.predicted_n || 0;
  const total = total_in + total_out;
  console.log(`\n${colors.grey}[tokens] in: ${total_in}  out: ${total_out}  total: ${total}/${CONTEXT_SIZE}${colors.reset}`);
}
