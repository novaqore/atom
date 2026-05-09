import { exec } from "node:child_process";
import { promisify } from "node:util";

const execAsync = promisify(exec);
const PWD_MARKER = "__ATOM_PWD_MARKER__";

const DANGEROUS = ["rm"];

function isDangerous(command) {
  return DANGEROUS.some((word) => new RegExp(`\\b${word}\\b`).test(command));
}

function parsePwd(text) {
  const idx = text.lastIndexOf(PWD_MARKER);
  if (idx === -1) return { output: text, newCwd: null };
  const newCwd = text.slice(idx + PWD_MARKER.length).trim();
  const output = text.slice(0, idx);
  return { output, newCwd };
}

export default {
  definition: {
    type: "function",
    function: {
      name: "bash",
      description:
        "Execute a bash command on the user's machine to fulfill a request that requires running code, inspecting files, or interacting with the system. Only use this when the user is asking you to do something that genuinely needs a shell command. Never use it to greet, chat, echo a message, or produce conversational output. Talk to the user directly with a normal text response instead.",
      parameters: {
        type: "object",
        properties: {
          command: {
            type: "string",
            description: "The bash command to execute",
          },
        },
        required: ["command"],
      },
    },
  },
  execute: async ({ command }, { askConfirm, unhinged, cwd, setCwd } = {}) => {
    if (!unhinged && isDangerous(command) && askConfirm) {
      const ok = await askConfirm(command);
      if (!ok)
        return "The user rejected this command and does not want it to run. Do not retry it or try a workaround. Acknowledge the rejection and ask the user what they would like to do instead.";
    }

    const startDir = cwd || process.cwd();
    const wrapped = `${command}\nprintf '%s%s' '${PWD_MARKER}' "$(pwd)"`;

    try {
      const { stdout = "", stderr = "" } = await execAsync(wrapped, {
        cwd: startDir,
      });
      const { output: cleanStdout, newCwd } = parsePwd(stdout);
      if (newCwd && setCwd) setCwd(newCwd);
      return [cleanStdout.trimEnd(), stderr.trimEnd()]
        .filter(Boolean)
        .join("\n")
        .replace(/\s+$/, "");
    } catch (err) {
      const stdout = err.stdout || "";
      const stderr = err.stderr || "";
      const { output: cleanStdout, newCwd } = parsePwd(stdout);
      if (newCwd && setCwd) setCwd(newCwd);
      const body = [cleanStdout.trimEnd(), stderr.trimEnd()]
        .filter(Boolean)
        .join("\n");
      return `Error (exit ${err.code ?? "?"}): ${err.message}\n${body}`.replace(
        /\s+$/,
        ""
      );
    }
  },
};
