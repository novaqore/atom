import { execSync } from "node:child_process";

export function tryRun(cmd, timeout = 1500) {
  try {
    return execSync(cmd, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      timeout,
    }).trim();
  } catch {
    return null;
  }
}
