import { mkdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { Command } from "commander";
import { render } from "ink";
import React from "react";
import { App } from "./app.js";
import { ATOM_DIR } from "./utils/paths.js";

async function readPackageVersion() {
  const pkgUrl = new URL("../package.json", import.meta.url);
  const raw = await readFile(fileURLToPath(pkgUrl), "utf8");
  return JSON.parse(raw).version;
}

export async function run(argv) {
  const version = await readPackageVersion();
  const program = new Command();

  program
    .name("atom")
    .description(
      "A full-system code agent with root-level access, built for isolated servers."
    )
    .version(version, "-v, --version", "Output the current version")
    .option("--unhinged", "Bypass confirmation for dangerous commands")
    .addHelpText(
      "after",
      `
Examples:
  $ atom             Start Atom
  $ atom --unhinged  Start Atom with no command guardrails
  $ atom -v          Print the current version

Learn more: https://github.com/novaqore/atom`
    )
    .action(async (opts) => {
      await mkdir(ATOM_DIR, { recursive: true, mode: 0o700 });
      process.stdout.write("\x1Bc");
      render(
        React.createElement(App, { version, unhinged: !!opts.unhinged })
      );
    });

  await program.parseAsync(argv);
}
