import { writeFileSync, readFileSync, mkdirSync } from "fs";
import { join } from "path";

const HISTORY_PATH = join(process.env.HOME, ".atom", "history.json");

export function saveHistory(messages) {
  try {
    mkdirSync(join(process.env.HOME, ".atom"), { recursive: true });
    writeFileSync(HISTORY_PATH, JSON.stringify(messages, null, 2));
  } catch {}
}

export function loadHistory() {
  try {
    return JSON.parse(readFileSync(HISTORY_PATH, "utf8"));
  } catch {
    return null;
  }
}
