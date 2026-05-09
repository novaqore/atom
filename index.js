#!/usr/bin/env node
import "./src/setup.js";
import { run } from "./src/cli.js";

run(process.argv).catch((err) => {
  console.error(err);
  process.exit(1);
});
