import { release, arch, cpus, totalmem } from "node:os";
import { peekRuntimes } from "./runtimes.js";
import {
  HOSTNAME,
  USERNAME,
  IS_ROOT,
  DISK,
  peekGPUs,
  peekPackageManagers,
} from "./system.js";

function cpuLine() {
  const list = cpus();
  if (!list || list.length === 0) return "CPU: unknown";
  const model = list[0].model.trim();
  const speed = list[0].speed;
  if (!speed) return `CPU: ${list.length} cores (${model})`;
  return `CPU: ${list.length} cores @ ${(speed / 1000).toFixed(2)} GHz (${model})`;
}

function memoryLine() {
  const gb = totalmem() / 1024 ** 3;
  return `Memory: ${gb.toFixed(1)} GB`;
}

function diskLine() {
  if (!DISK) return null;
  const totalGB = (DISK.total / 1024 ** 3).toFixed(1);
  const usedGB = (DISK.used / 1024 ** 3).toFixed(1);
  return `Disk: ${usedGB} GB used / ${totalGB} GB total`;
}

function gpuLine() {
  const gpus = peekGPUs();
  if (gpus === null) return null;
  if (gpus.length === 0) return null;
  return `GPU: ${gpus.join(", ")}`;
}

function runtimesLine() {
  const cached = peekRuntimes();
  const installed = Object.entries(cached)
    .filter(([, v]) => v && v !== "not installed")
    .map(([k, v]) => `${k} ${v}`);
  if (installed.length === 0) return null;
  return `Runtimes: ${installed.join(", ")}`;
}

function packageManagerLines() {
  const pms = peekPackageManagers();
  if (pms === null) return [];
  const out = [];
  if (pms.system.length > 0)
    out.push(`Package managers (system): ${pms.system.join(", ")}`);
  if (pms.language.length > 0)
    out.push(`Package managers (language): ${pms.language.join(", ")}`);
  if (pms.container.length > 0)
    out.push(`Package managers (container): ${pms.container.join(", ")}`);
  return out;
}

export function buildSystemPrompt() {
  const env = [
    `Hostname: ${HOSTNAME}`,
    `User: ${USERNAME}${IS_ROOT ? " (root)" : ""}`,
    `Platform: ${process.platform} (${release()}, ${arch()})`,
    `Shell: ${process.env.SHELL || "unknown"}`,
    `Working directory: ${process.cwd()}`,
    cpuLine(),
    memoryLine(),
    diskLine(),
    gpuLine(),
    runtimesLine(),
    ...packageManagerLines(),
  ]
    .filter(Boolean)
    .join("\n");

  return `You are Atom, a full-system code agent. You run on the server you are operating (typically an isolated server or VM), with shell access at the system level. You can read, write, and execute anywhere your process has permission, including system paths and service configuration.

You help with software engineering tasks across the whole machine: writing and debugging code, refactoring, explaining unfamiliar code, reviewing changes, configuring services, and operating on system files when the user asks. You favor clear, idiomatic solutions over clever ones, and you keep your responses concise.

You have access to tools when they help you complete a task. Use them when running a command or inspecting the environment is the most direct way to answer.

Always use structured sentences. Do not use em dashes or dashes in your writing.

Environment:
${env}`;
}
