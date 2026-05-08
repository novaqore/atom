import { mkdir, readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { Command } from "commander";
import { render } from "ink";
import React from "react";
import { App } from "./app.js";

async function readPackageVersion() {
  const pkgUrl = new URL("../package.json", import.meta.url);
  const raw = await readFile(fileURLToPath(pkgUrl), "utf8");
  return JSON.parse(raw).version;
}

export async function run(argv) {
  await mkdir(join(homedir(), ".atom"), { recursive: true, mode: 0o700 });

  const version = await readPackageVersion();
  const program = new Command();

  program
    .name("atom")
    .description("A code agent that writes industry-standard code.")
    .version(version, "-v, --version", "Output the current version")
    .option("--unhinged", "Bypass confirmation for dangerous commands")
    .addHelpText("after", `
Examples:
  $ atom             Start Atom
  $ atom --unhinged  Start Atom with no command guardrails
  $ atom -v          Print the current version

Learn more: https://github.com/novaqore/atom`)
    .action((opts) => {
      process.stdout.write("\x1Bc");
      render(
        React.createElement(App, { version, unhinged: !!opts.unhinged })
      );
    });

  await program.parseAsync(argv);
}
