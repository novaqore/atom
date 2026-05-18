# Roadmap

## Up next

### Multiline input (bracketed paste)

Pasted text containing newlines currently auto-submits at the first newline, breaking longer prompts. The plan is to enable terminal bracketed paste mode and intercept the start/end markers so pasted content sits in the input buffer for review before you press Enter.

### Block full-TTY commands

Atom captures shell tool output through a pipe, so full-screen interactive apps (vim, htop, less, top, nano, etc.) do not render correctly and can lock the agent until killed. These are human-only tools and have no place in an autonomous agent's workflow. The plan is to detect known full-TTY commands and refuse with a clear message so the agent stays responsive.

### Selective context injection (SSH hosts, env vars)

Today the system prompt lists every host in `~/.ssh/config` and every key in `process.env` (filtered for system noise). For machines with lots of hosts or many env vars this bloats the prompt and may leak more context than the user wants the model to see. The plan is a multi-select picker in the settings menu (checkbox UI, space to toggle, Enter to save) that persists choices to `~/.atom/selections.json`, and at startup the system prompt filters to only the selected items. Default to all-on so behavior matches today out of the box.

### Context window management

The messages array grows every turn and eventually approaches the model's context window. Three approaches we are weighing:

- **Rolling window**: drop the oldest messages once a threshold is hit.
- **Compress and inject**: summarize older turns into a single condensed message, keep recent turns intact.
- **Minimal context with live injection**: keep the context aggressively small and inject only the live data the model needs for the current turn (current cwd, recent tool output, relevant file state, etc.).

Each has trade-offs. Rolling is simple but loses context. Compressing keeps continuity but costs extra tokens and risks losing detail. Live injection is the leanest and most context-efficient but requires deciding what counts as "relevant" per turn. We will test all three and see which feels right in practice.

## Future

Open for ideas.
