# Atom

Atom is a server agent. It runs on the box it operates, with shell access at the system level and full awareness of its environment: platform, runtime, shell, and working directory. Use it where you want an autonomous agent that reads, writes, and executes across the whole server, not just inside a project folder.

> [!WARNING]
> Atom is not intended for personal machines. It runs with shell access at the system level by design. Only use it in isolated environments such as AWS EC2 instances, DigitalOcean droplets, GCP VMs, Hetzner servers, Linode boxes, or Fly.io machines.

> Status: [![npm version](https://badge.fury.io/js/%40novaqore%2Fatom.svg)](https://badge.fury.io/js/%40novaqore%2Fatom)

## Install

```bash
npm install -g @novaqore/atom
```

This installs the `atom` command globally.

## Quick start

Once installed, run it from any directory:

```bash
atom
```

## How it works

### Agent capabilities

The agent can run shell commands and edit files in place.

### Interactive shell

When a shell command needs input (ssh, `read`, `npm init`, password prompts), your terminal is handed to the child process. You type, the child reads, the agent waits. When the child exits, the agent picks back up with the captured output. You can ssh into another machine through Atom and run commands there in full interactive mode.

### SSH hosts

On startup Atom reads `~/.ssh/config` and exposes every `Host` block (skipping wildcards) to the model. For each host it builds the actual ssh command — including `-i <IdentityFile>` and `-p <Port>` when present — and lists them in the system prompt as:

```
- unit-1: ssh -i ~/.ssh/id_unit1 admin@192.168.1.10
- unit-2: ssh deploy@10.0.0.1
- prod-db: ssh -i ~/.ssh/id_prod -p 2222 admin@db.example.com
```

That means you can say things like:

- **"check disk usage on the main_frame"** — the model runs the matching ssh command, captures `df -h`, and reports back
- **"pull up a terminal on prod-db"** — Atom hands you a full interactive session on that box
- **"sync the config from box-1 to box-2"** — the model chains ssh + scp using the right keys

Hosts that don't have an IdentityFile will prompt for a password through your terminal. Anything you put in `~/.ssh/config` is what the model knows about.

### Abort

Press ESC at any time to kill both the LLM stream and any running shell command. Instant. The LLM call is torn down via AbortController, the child process via SIGKILL.

## Local LLM (custom base URL)

By default, Atom talks to NovaQore's hosted API. To point it at your own GPU running [llama.cpp](https://github.com/ggerganov/llama.cpp) (or any OpenAI-compatible server), set a custom base URL:

```bash
atom set base_url http://your-gpu-host:8080
```

Other commands:

```bash
atom show base_url    # print the current value
atom remove base_url  # clear it (falls back to the default)
```

The setting is persisted to `~/.atom/.env`. Under the hood, Atom uses [@novaqore/ai](https://www.npmjs.com/package/@novaqore/ai). See its README for how requests map to the `/v1/chat/completions` endpoint.

## Roadmap

See [ROADMAP.md](ROADMAP.md) for what's coming next.

## More info

Atom runs on the NovaQore AI infrastructure. 

1. Learn more at [novaqore.ai](https://novaqore.ai).
2. Join our Discord (it's new) [NovaQore AI Discord (Atom)](https://discord.gg/auhaUr2jtv).

## Requirements

- Node.js 20 or higher

## License

MIT © NovaQore LLC. See [LICENSE](LICENSE).

