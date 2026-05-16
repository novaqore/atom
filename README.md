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

### Two tools, by design

Atom ships with exactly two tools:

- **shell** auto-named after your actual shell (`zsh`, `bash`, `powershell`)
- **sed** for surgical file edits

Only two on purpose. There is no `write_file` tool, so the model is biased toward sed for any edit. Full rewrites are still possible through shell heredoc but slightly awkward, which is the feature.

### Interactive shell

When a shell command needs input (ssh, `read`, `npm init`, password prompts), your terminal is handed to the child process. You type, the child reads, the agent waits. When the child exits, the agent picks back up with the captured output. You can ssh into another machine through Atom and run commands there in full interactive mode.

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
