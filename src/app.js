import { chat } from "./lib/novaqore.js";
import { tools, runTool, displayTool, processToolCall } from "./tools/run_tool.js";
import { system_prompt } from "./system/prompt.js";
import { spinner } from "./ui/spinner.js";
import header from "./ui/header.js";
import { wake } from "./system/wake.js";
import { colors } from "./ui/theme.js";
import { rl, mute_input, unmute_input, user_input } from "./ui/input.js";
import { addTokens } from "./ui/token_count.js";
import { parseMarkdown } from "./ui/markdown.js";
import { abort as abortShell } from "./tools/commands/shell.js";
import { loadEnv } from "./config/env.js";

const MAX_TOOL_CALLS = 50;

export default async function app() {
  console.clear()
  await header()

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
      let renderedChars = 0;
      let assistantToolCalls = [];

      mute_input();
      spinner.stop();
      spinner.start('Thinking...', 'cyan');
      let aborted = false;
      let errored = null;
      let working = false;

      try {
        const { stream, abort } = await chat({ messages, tools, model: (loadEnv()?.MODEL) || "qwen3.6-27b" });
        currentAbort = abort;

        for await (const chunk of stream) {
          addTokens(chunk);
          const delta = chunk.choices[0]?.delta;

          if (delta?.content) {
            spinner.stop();
            assistantContent += delta.content;
            const { output, consumed } = parseMarkdown(assistantContent, renderedChars);
            if (output) {
              process.stdout.write(output);
              renderedChars = consumed;
            }
          }
          if (delta?.tool_calls) {
            if (!working) {
              spinner.stop();
              spinner.start('Working...', 'yellow');
              working = true;
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

      if (renderedChars < assistantContent.length) {
        process.stdout.write(assistantContent.slice(renderedChars));
        renderedChars = assistantContent.length;
      }
      if (assistantContent) process.stdout.write(colors.reset);

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
        result = await runTool(name, args, working);
        messages.push({ tool_call_id: tc.id, role: "tool", content: result });
      }
    }

    user_input();
  }
}
