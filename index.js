#!/usr/bin/env node
import { readFileSync, unlinkSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { Command } from 'commander';
import { mainMenu } from "./src/menu/main.js";
import { loadEnv, saveEnv } from "./src/config/env.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(join(__dirname, 'package.json'), 'utf8'));

const KEY_MAP = {
  base_url: 'NOVAQORE_INTERNAL_URL',
  model: 'MODEL',
};

function resolveKey(key) {
  const envKey = KEY_MAP[key];
  if (!envKey) {
    console.log(`Unknown key: ${key}. Available: ${Object.keys(KEY_MAP).join(', ')}`);
    process.exit(1);
  }
  return envKey;
}

const program = new Command();

program
  .name('atom')
  .description(pkg.description)
  .version(pkg.version, '-v, --version', 'output the current version')
  .helpOption('-h, --help', 'display help for command')
  .action(() => mainMenu());

program
  .command('set <key> <value>')
  .description('Set a config value (e.g. base_url)')
  .action((key, value) => {
    const envKey = resolveKey(key);
    const env = loadEnv() || {};
    env[envKey] = value;
    saveEnv(env);
    console.log(`${key} set to ${value}`);
  });

program
  .command('remove <key>')
  .description('Remove a config value')
  .action((key) => {
    const envKey = resolveKey(key);
    const env = loadEnv() || {};
    delete env[envKey];
    saveEnv(env);
    console.log(`${key} removed`);
  });

program
  .command('show <key>')
  .description('Show a config value')
  .action((key) => {
    const envKey = resolveKey(key);
    const env = loadEnv();
    console.log(env?.[envKey] || '(not set)');
  });

program
  .command('delete history')
  .description('Clear chat history to start fresh')
  .action(() => {
    const historyPath = join(process.env.HOME, '.atom', 'history.json');
    if (existsSync(historyPath)) {
      unlinkSync(historyPath);
      console.log('Chat history cleared.');
    } else {
      console.log('No history file found.');
    }
  });

program.parse();
