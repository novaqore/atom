import { readdirSync } from 'fs';
import { fileURLToPath, pathToFileURL } from 'url';
import path from 'path';
import { spinner } from '../components/spinner.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const commandsDir = path.join(__dirname, 'commands');

const tools_list = [];
const handlers = {};
const displays = {};

for (const file of readdirSync(commandsDir).filter(f => f.endsWith('.js'))) {
  const mod = await import(pathToFileURL(path.join(commandsDir, file)).href);
  const name = mod.definition.function.name;
  tools_list.push(mod.definition);
  handlers[name] = mod.run;
  if (mod.display) displays[name] = mod.display;
}

export const tools = tools_list;

export function displayTool(name, args) {
  const fn = displays[name];
  return fn ? fn(args) : JSON.stringify(args);
}

export async function runTool(name, args) {
  const handler = handlers[name];
  if (!handler) return `Error: Unknown tool "${name}"`;

  const result = await handler(args);
  spinner.start('Working...', 'yellow');
  return result;
}

export function processToolCall(toolCalls, delta) {
  for (const tc of delta.tool_calls) {
    const index = tc.index || 0;
    if (!toolCalls[index]) {
      toolCalls[index] = {
        id: tc.id || "",
        type: tc.type || "function",
        function: { name: "", arguments: "" }
      };
    }

    const current = toolCalls[index];

    if (tc.id) current.id = tc.id;
    if (tc.type) current.type = tc.type;

    if (tc.function) {
      if (tc.function.name) current.function.name = tc.function.name;
      if (tc.function.arguments) current.function.arguments += tc.function.arguments;
    }
  }
}
