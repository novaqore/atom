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

## More info

Atom runs on the NovaQore AI infrastructure. 

1. Learn more at [novaqore.ai](https://novaqore.ai).
2. Join our Discord (it's new) [NovaQore AI Discord (Atom)](https://discord.gg/auhaUr2jtv).

## Requirements

- Node.js 20 or higher

## License

MIT © NovaQore LLC. See [LICENSE](LICENSE).
