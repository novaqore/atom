import { chat } from "./lib/novaqore.js";
import { tools, runTool, displayTool, processToolCallDelta } from "./tools/run_tool.js";
import { system_prompt } from "./utils/system_prompt.js";
import { LoadingSpinner } from "./components/loading.js";
import header from "./components/header.js";
import { wake } from "./utils/wake.js";
import { colors } from "./utils/theme.js";
import { rl, mute_input, unmute_input, user_input } from "./helpers/input.js";

export default async function app() {
  let MAX_TOOL_CALLS = 20;
  const thinking = new LoadingSpinner();
  console.clear()
  header()

  let currentAbort = null;
  process.stdin.on('keypress', (_, key) => {
    if (key?.name === 'escape' && currentAbort) currentAbort();
  });

  let messages = [system_prompt];

  mute_input(); 
  await wake();
  unmute_input();
  user_input();

  for await (const line of rl) {
    const input = line.trim();
    if (!input) continue;
    if (input.toLowerCase() === 'exit') process.exit();

    messages.push({ role: "user", content: input });
    process.stdout.write(colors.reset);

    let tool_calls = 0;

    while (true) {
      if (tool_calls >= MAX_TOOL_CALLS) {
        process.stdout.write(`${colors.red}Max tool calls (${MAX_TOOL_CALLS}) reached${colors.reset}\n`);
        break;
      }

      tool_calls++;

      let assistantContent = "";
      let assistantToolCalls = [];

      mute_input();
      thinking.start();
      let aborted = false;
      let errored = null;

      try {
        const { stream, abort } = await chat({ messages, tools });
        currentAbort = abort;

        for await (const chunk of stream) {
          const delta = chunk.choices[0]?.delta;

          if (delta?.content) {
            thinking.stop();
            process.stdout.write(delta.content);
            assistantContent += delta.content;
          }

          if (delta?.tool_calls) {
            thinking.stop();
            processToolCallDelta(assistantToolCalls, delta.tool_calls);
          }
        }

      } catch (err) {
        if (err.name === 'AbortError') aborted = true;
        else errored = err;
      } finally {
        currentAbort = null;
        unmute_input();
        thinking.stop();
      }

      if (errored) {
        process.stdout.write(`${colors.red}${errored.message || errored}${colors.reset}\n`);
        break;
      }

      process.stdout.write('\n');

      if (aborted) {
        process.stdout.write(`${colors.red}[aborted]${colors.reset}\n`);
        if (assistantContent) {
          messages.push({ role: "assistant", content: `${assistantContent} [interrupted by user]` });
        }
        break;
      }

      assistantToolCalls = assistantToolCalls.filter(tc => tc && tc.function.name);

      if (assistantToolCalls.length === 0) {
        messages.push({ role: "assistant", content: assistantContent });
        break;
      }

      messages.push({ role: "assistant", content: assistantContent || null, tool_calls: assistantToolCalls });

      for (const tc of assistantToolCalls) {
        const name = tc.function.name;
        let args;
        let result;

        try {
          args = JSON.parse(tc.function.arguments);
        } catch (e) {
          process.stdout.write(`${colors.yellow}${name}${colors.reset}\n`);
          messages.push({ tool_call_id: tc.id, role: "tool", content: `JSON Parse Error: ${e.message}` });
          continue;
        }

        process.stdout.write(`${colors.yellow}${name}${colors.reset} ${displayTool(name, args)}`);
        result = await runTool(name, args);
        process.stdout.write(`\n${colors.grey}${result}${colors.reset}\n`);
        messages.push({ tool_call_id: tc.id, role: "tool", content: result });
      }
    }

    user_input();
  }
}
