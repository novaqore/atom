import { hostname, userInfo } from "node:os";
import { tryRun } from "./exec.js";

export const HOSTNAME = hostname();
export const USERNAME = userInfo().username;
export const IS_ROOT =
  typeof process.getuid === "function" && process.getuid() === 0;

function detectGPUs() {
  if (process.platform === "darwin") {
    const out = tryRun("system_profiler SPDisplaysDataType 2>/dev/null", 4000);
    if (!out) return [];
    return [...out.matchAll(/^\s*Chipset Model:\s+(.+)$/gm)].map((m) =>
      m[1].trim()
    );
  }
  if (process.platform === "linux") {
    const nvidia = tryRun(
      "nvidia-smi --query-gpu=name --format=csv,noheader 2>/dev/null",
      2000
    );
    if (nvidia) {
      return nvidia
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
    }
    const lspci = tryRun("lspci 2>/dev/null", 1500);
    if (!lspci) return [];
    return lspci
      .split("\n")
      .filter((l) => /VGA|3D controller|Display controller/i.test(l))
      .map((l) => {
        const m = l.match(
          /(?:VGA compatible controller|3D controller|Display controller):\s+(.+)/i
        );
        return m ? m[1].trim() : l;
      });
  }
  return [];
}

let _gpus = null;
export function getGPUs() {
  if (_gpus === null) _gpus = detectGPUs();
  return _gpus;
}
export function peekGPUs() {
  return _gpus;
}

const PM_GROUPS = {
  system: ["apt", "apt-get", "dnf", "yum", "pacman", "apk", "brew", "zypper"],
  language: [
    "npm",
    "pnpm",
    "yarn",
    "pip3",
    "pip",
    "pipx",
    "poetry",
    "gem",
    "bundler",
    "cargo",
    "composer",
    "maven",
    "gradle",
  ],
  container: ["docker", "podman"],
};

function detectInGroup(group) {
  return group.filter((pm) => tryRun(`command -v ${pm}`));
}

let _pms = null;
export function getPackageManagers() {
  if (_pms === null) {
    _pms = {
      system: detectInGroup(PM_GROUPS.system),
      language: detectInGroup(PM_GROUPS.language),
      container: detectInGroup(PM_GROUPS.container),
    };
  }
  return _pms;
}
export function peekPackageManagers() {
  return _pms;
}

function detectDisk() {
  const out = tryRun("df -kP .");
  if (!out) return null;
  const lines = out.split("\n");
  if (lines.length < 2) return null;
  const fields = lines[lines.length - 1].split(/\s+/);
  const totalKB = parseInt(fields[1], 10);
  const usedKB = parseInt(fields[2], 10);
  if (isNaN(totalKB) || isNaN(usedKB)) return null;
  return {
    total: totalKB * 1024,
    used: usedKB * 1024,
  };
}

export const DISK = detectDisk();
