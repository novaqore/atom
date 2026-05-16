import { chat } from "../lib/novaqore.js";
import { system_prompt } from "./system_prompt.js";
import { LoadingSpinner } from "../components/loading.js";
import { colors } from "./theme.js";

const WAKE_PROMPT = "Greet the user with a short greeting.";

export async function wake() {
  const thinking = new LoadingSpinner('Waking up...', 'green');

  const messages = [system_prompt, { role: "user", content: WAKE_PROMPT }];

  thinking.start();
  try {
    const { stream } = await chat({ messages });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        thinking.stop();
        process.stdout.write(content);
      }
    }
  } catch (err) {
    thinking.stop();
    process.stdout.write(`${colors.red}${err.message || err}${colors.reset}`);
  }
  thinking.stop();
  process.stdout.write('\n');
}
