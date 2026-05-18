import { chat } from "./lib/novaqore.js";
import { tools, runTool, displayTool, processToolCall } from "./tools/run_tool.js";
import { system_prompt } from "./system/prompt.js";
import { spinner } from "./components/spinner.js";
import header from "./components/header.js";
import { wake } from "./utils/wake.js";
import { colors } from "./utils/theme.js";
import { rl, mute_input, unmute_input, user_input } from "./helpers/input.js";
import { addTokens } from "./utils/token_count.js";
import { abort as abortShell } from "./tools/commands/shell.js";

const MAX_TOOL_CALLS = 20;

export default async function app() {
  console.clear()
  header()

  let currentAbort = null;
  process.stdin.on('keypress', (_, key) => {
    if (key?.name === 'escape') {
      if (currentAbort) currentAbort();
      abortShell();
    }
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
      spinner.stop();
      spinner.start('Thinking...', 'cyan');
      let aborted = false;
      let errored = null;
      let workingStarted = false;

      try {
        const { stream, abort } = await chat({ messages, tools });
        currentAbort = abort;

        for await (const chunk of stream) {
          addTokens(chunk);
          const delta = chunk.choices[0]?.delta;

          if (delta?.content) {
            spinner.stop();
            process.stdout.write(delta.content);
            assistantContent += delta.content;
          }

          if (delta?.tool_calls) {
            if (!workingStarted) {
              spinner.stop();
              spinner.start('Working...', 'yellow');
              workingStarted = true;
            }
            processToolCall(assistantToolCalls, delta);
          }
        }

      } catch (err) {
        spinner.stop();
        if (err.name === 'AbortError') aborted = true;
        else errored = err;
      } finally {
        currentAbort = null;
        unmute_input();
      }

      if (errored) {
        process.stdout.write(`\n${colors.red}${errored.message || errored}${colors.reset}\n`);
        break;
      }

      if (aborted) {
        process.stdout.write(`\n${colors.red}[aborted]${colors.reset}\n`);
        if (assistantContent) {
          messages.push({ role: "assistant", content: `${assistantContent} [interrupted by user]` });
        }
        break;
      }

      assistantToolCalls = assistantToolCalls.filter(tc => tc && tc.function.name);

      if (assistantToolCalls.length === 0) {
        spinner.stop();
        process.stdout.write('\n');
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

        spinner.stop();
        process.stdout.write(`\r\x1b[2K${colors.yellow}${name}${colors.reset} ${displayTool(name, args)}\n`);
        result = await runTool(name, args, workingStarted);
        messages.push({ tool_call_id: tc.id, role: "tool", content: result });
      }
    }

    user_input();
  }
}
