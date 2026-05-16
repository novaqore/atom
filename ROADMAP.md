# Roadmap

## Up next

### Multiline input (bracketed paste)

Pasted text containing newlines currently auto-submits at the first newline, breaking longer prompts. The plan is to enable terminal bracketed paste mode and intercept the start/end markers so pasted content sits in the input buffer for review before you press Enter.

### Block full-TTY commands

Atom captures shell tool output through a pipe, so full-screen interactive apps (vim, htop, less, top, nano, etc.) do not render correctly and can lock the agent until killed. These are human-only tools and have no place in an autonomous agent's workflow. The plan is to detect known full-TTY commands and refuse with a clear message so the agent stays responsive.

### Context window management

The messages array grows every turn and eventually approaches the model's context window. Three approaches we are weighing:

- **Rolling window**: drop the oldest messages once a threshold is hit.
- **Compress and inject**: summarize older turns into a single condensed message, keep recent turns intact.
- **Minimal context with live injection**: keep the context aggressively small and inject only the live data the model needs for the current turn (current cwd, recent tool output, relevant file state, etc.).

Each has trade-offs. Rolling is simple but loses context. Compressing keeps continuity but costs extra tokens and risks losing detail. Live injection is the leanest and most context-efficient but requires deciding what counts as "relevant" per turn. We will test all three and see which feels right in practice.

## Future

Open for ideas.
