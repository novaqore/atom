# Atom

A code agent built to produce industry-standard code.

Atom is a CLI agent for software engineering tasks, built by NovaQore LLC. It is designed around one principle: the output must be code that a senior engineer would ship. Readable, idiomatic, and free of the bloat and bad habits that have crept into general-purpose AI coding tools.

> Status: early development (`v0.0.1`). The CLI scaffold is in place; the agent core is being built next.

## Install

```bash
npm install -g @novaqore/atom
```

This installs the `atom` command globally.

## Get your keys

Atom runs on the NovaQore AI service. You will need an account and a Quantum Key before you can use the agent.

1. Sign up at [novaqore.ai](https://novaqore.ai).
2. Generate a UID, Key ID, and Quantum Key from your account dashboard.
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
