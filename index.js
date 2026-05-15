#!/usr/bin/env node
import NovaQoreAI from "@novaqore/ai";
import { execSync } from 'child_process';
import { tools } from "./src/utils/tools.js";
import { system_prompt } from "./src/utils/system_prompt.js";
import { loadEnv } from "./src/utils/env.js";
import header from "./src/components/header.js";

export default async function app() {
  const env = loadEnv();
  const internalUrl = env?.NOVAQORE_INTERNAL_URL;
  const ai = new NovaQoreAI(internalUrl ? { base_url: internalUrl } : {});
  const { chat } = ai;
    console.clear()
    header(internalUrl)
    process.stdin.setEncoding('utf8');
    process.stdin.resume();
    const width = process.stdout.columns || 80;

    let messages = [system_prompt];

    process.stdout.write('\x1b[90m' + '─'.repeat(width) + '\x1b[0m');
    process.stdout.write('\x1b[90m> \x1b[0m');

  for await (const line of process.stdin) {
    const input = line.trim();
    if (!input) continue;
    if (input.toLowerCase() === 'exit') process.exit();

    messages.push({ role: "user", content: input });

    let assistantContent = "";
    let assistantToolCalls = [];
    let hasToolCalls = false;
    
    const { stream } = await chat(messages, tools);

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta;
      
      if (delta?.content) {
        process.stdout.write(delta.content);
        assistantContent += delta.content;
      }

      if (delta?.tool_calls) {
        hasToolCalls = true;
        for (const tc of delta.tool_calls) {
          const index = tc.index || 0;
          if (!assistantToolCalls[index]) {
            assistantToolCalls[index] = {
              id: tc.id || "",
              type: tc.type || "function",
              function: { name: "", arguments: "" }
            };
          }

          const current = assistantToolCalls[index];
          
          if (tc.id) current.id = tc.id;
          if (tc.type) current.type = tc.type;
          
          if (tc.function) {
            if (tc.function.name) current.function.name = tc.function.name;
            if (tc.function.arguments) current.function.arguments += tc.function.arguments;
          }
        }
      }
    }
    
    process.stdout.write('\n');

    assistantToolCalls = assistantToolCalls.filter(tc => tc && tc.function.name);

    if (hasToolCalls && assistantToolCalls.length > 0) {
      const assistantMsg = {
        role: "assistant",
        content: assistantContent || null,
        tool_calls: assistantToolCalls
      };
      messages.push(assistantMsg);
      
      const toolResults = [];
      
      for (const tc of assistantToolCalls) {
        const { command } = JSON.parse(tc.function.arguments)
        process.stdout.write(`\x1b[33m${tc.function.name.charAt(0).toUpperCase() + tc.function.name.slice(1)}\x1b[0m ${command}`);        
        let result = "Error: Unknown tool";
        
        try {
          const args = JSON.parse(tc.function.arguments);
          if (tc.function.name === "bash") {
            try {
              result = execSync(args.command, { encoding: 'utf8', timeout: 5000});
              process.stdout.write('\n\x1b[90m' + result + '\x1b[0m');
            } catch (err) {
              result = err.stderr || err.message || "Command failed";
            }
          }
          
        } catch (e) {
          result = `JSON Parse Error: ${e.message}`;
        }
        process.stdout.write('\n\n');

        toolResults.push({
          tool_call_id: tc.id,
          role: "tool",
          content: result
        });
      }

      messages.push(...toolResults);

      const { stream: finalStream } = await chat(messages, { stream: true, tools });
      let finalResponse = "";
      
      for await (const chunk of finalStream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          process.stdout.write(content);
          finalResponse += content;
        }
      }
      
      messages.push({ role: "assistant", content: finalResponse });
    } else {
      messages.push({ role: "assistant", content: assistantContent });
    }

    process.stdout.write('\n');
    process.stdout.write('\x1b[90m' + '─'.repeat(width) + '\x1b[0m');
    process.stdout.write('\x1b[90m> \x1b[0m');
  }
}

app()