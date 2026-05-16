# Roadmap

## Up next

### Multiline input (bracketed paste)

Pasted text containing newlines currently auto-submits at the first newline, breaking longer prompts. The plan is to enable terminal bracketed paste mode and intercept the start/end markers so pasted content sits in the input buffer for review before you press Enter.

### Block full-TTY commands

Atom captures shell tool output through a pipe, so full-screen interactive apps (vim, htop, less, top, nano, etc.) do not render correctly and can lock the agent until killed. These are human-only tools and have no place in an autonomous agent's workflow. The plan is to detect known full-TTY commands and refuse with a clear message so the agent stays responsive.

## Future

Open for ideas.
