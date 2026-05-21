import { spinner } from "../ui/spinner.js";
import { colors } from "../ui/theme.js";
import { ai } from "../lib/novaqore.js";

export async function wake(messages) {
  const hasHistory = messages.length > 1; // system prompt counts as 1
  const wakePrompt = hasHistory ? "I'm back." : "Hey";
  const wakeMessages = [
    ...messages,
    { role: "user", content: wakePrompt }
  ];

  spinner.start('Waking up..this might take a minute...', 'green');
  let content = '';
  try {
    const { stream } = await ai.chat({ messages: wakeMessages });

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content || '';
      if (delta) {
        spinner.stop();
        content += delta;
        process.stdout.write(delta);
      }
    }
  } catch (err) {
    spinner.stop();
    process.stdout.write(`${colors.red}${err.message || err}${colors.reset}`);
  }
  spinner.stop();
  process.stdout.write('\n');

  return content;
}
