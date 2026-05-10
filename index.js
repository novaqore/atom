#!/usr/bin/env node
if (!process.env.FORCE_COLOR) process.env.FORCE_COLOR = "3";

const { run } = await import("./src/cli.js");

run(process.argv).catch((err) => {
  console.error(err);
  process.exit(1);
});
