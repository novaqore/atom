# Atom

Atom is a server agent. It runs on the box it operates, with shell access at the system level and full awareness of its environment: platform, runtime, shell, and working directory. Use it where you want an autonomous agent that reads, writes, and executes across the whole server, not just inside a project folder.

> [!WARNING]
> Atom is not intended for personal machines. It runs with shell access at the system level by design. Only use it in isolated environments such as AWS EC2 instances, DigitalOcean droplets, GCP VMs, Hetzner servers, Linode boxes, or Fly.io machines.

> Status: experimental (`v0.0.1`). The CLI scaffold is in place; the agent core is being built next.

## Install

```bash
npm install -g @novaqore/atom
```

This installs the `atom` command globally.

## Get your keys

Atom runs on the NovaQore AI service. You will need an account and a Quantum Key before you can use the agent.

1. Sign up at [novaqore.ai](https://novaqore.ai).
2. Generate a UID, Key ID, and Quantum Key at [chat.novaqore.ai/keys](https://chat.novaqore.ai/keys).
3. Keep them somewhere safe. Atom asks for them on first run.

## Quick start

Once installed, run it from any directory:

```bash
atom
```

The first run walks you through onboarding and asks for your UID, Key ID, and Quantum Key. They are stored locally in `~/.atom/` and only sent to the NovaQore AI service when you chat.

## Requirements

- Node.js 20 or higher

## License

MIT © NovaQore LLC. See [LICENSE](LICENSE).
