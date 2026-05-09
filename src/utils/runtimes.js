import { tryRun } from "./exec.js";

function detectVersion(cmd, regex) {
  const out = tryRun(cmd);
  if (!out) return "not installed";
  const match = out.match(regex);
  return match ? match[1] : "not installed";
}

function detectPython() {
  const v = detectVersion("python3 --version 2>&1", /Python\s+(\S+)/i);
  if (v !== "not installed") return v;
  return detectVersion("python --version 2>&1", /Python\s+(\S+)/i);
}

const lazySpecs = {
  ruby: ["ruby --version 2>&1", /ruby\s+(\S+)/i],
  go: ["go version 2>&1", /go(\d[\d.]+)/i],
  rust: ["rustc --version 2>&1", /rustc\s+(\S+)/i],
  java: ["java -version 2>&1", /version\s+"([^"]+)"/i],
  php: ["php --version 2>&1", /PHP\s+(\S+)/i],
  deno: ["deno --version 2>&1", /deno\s+(\S+)/i],
  bun: ["bun --version 2>&1", /(\S+)/],
};

const cache = {
  node: process.version,
  python: detectPython(),
};

function readKey(key) {
  if (key in cache) return cache[key];
  if (key in lazySpecs) {
    const [cmd, regex] = lazySpecs[key];
    cache[key] = detectVersion(cmd, regex);
    return cache[key];
  }
  return undefined;
}

const allKeys = ["node", "python", ...Object.keys(lazySpecs)];

export function peekRuntimes() {
  return { ...cache };
}

export const RUNTIMES = new Proxy(
  {},
  {
    get(_t, prop) {
      return readKey(prop);
    },
    has(_t, prop) {
      return allKeys.includes(prop);
    },
    ownKeys() {
      return allKeys;
    },
    getOwnPropertyDescriptor(_t, prop) {
      if (allKeys.includes(prop)) {
        return {
          enumerable: true,
          configurable: true,
          value: readKey(prop),
        };
      }
      return undefined;
    },
  }
);
