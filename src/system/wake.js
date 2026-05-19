import { chat } from "../lib/novaqore.js";
import { system_prompt } from "./prompt.js";
import { spinner } from "../ui/spinner.js";
import { colors } from "../ui/theme.js";

const WAKE_PROMPT = "Greet the user with a short greeting.";

export async function wake() {
  const messages = [system_prompt, { role: "user", content: WAKE_PROMPT }];

  spinner.start('Waking up...', 'green');
  try {
    const { stream } = await chat({ messages });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        spinner.stop();
        process.stdout.write(content);
      }
    }
  } catch (err) {
    spinner.stop();
    process.stdout.write(`${colors.red}${err.message || err}${colors.reset}`);
  }
  spinner.stop();
  process.stdout.write('\n');
}
