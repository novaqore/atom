import { readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));

const folders = readdirSync(here, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name);

const registry = {};
for (const folder of folders) {
  const mod = await import(pathToFileURL(join(here, folder, "tool.js")).href);
  const tool = mod.default;
  registry[tool.definition.function.name] = tool;
}

export const tools = Object.values(registry).map((t) => t.definition);

export async function executeTool(name, rawArgs, context = {}) {
  const tool = registry[name];
  if (!tool) return `Error: unknown tool "${name}"`;
  let args;
  try {
    args = typeof rawArgs === "string" ? JSON.parse(rawArgs || "{}") : rawArgs || {};
  } catch (err) {
    return `Error: invalid arguments JSON: ${err.message}`;
  }
  return tool.execute(args, context);
}
