import { marked } from "marked";
import { markedTerminal } from "marked-terminal";
import chalk from "chalk";

const ext = markedTerminal({
  codespan: chalk.bold.white,
  text: chalk.white,
});

// Patch: marked-terminal v7's text renderer ignores nested inline tokens
// (codespan, strong, em, link, etc.) when they appear inside list items.
// Force it to parse them inline so styling works in lists too.
const origText = ext.renderer.text;
ext.renderer.text = function (token) {
  if (
    typeof token === "object" &&
    Array.isArray(token.tokens) &&
    token.tokens.length > 0
  ) {
    return this.parser.parseInline(token.tokens);
  }
  return origText.call(this, token);
};

marked.use(ext);

function balanceForStreaming(buffer) {
  let out = buffer;

  const fences = (out.match(/```/g) || []).length;
  if (fences % 2 === 1) out += "\n```";

  const bolds = (out.match(/\*\*/g) || []).length;
  if (bolds % 2 === 1) out += "**";

  const stripped = out.replace(/```[\s\S]*?```/g, "");
  const ticks = (stripped.match(/`/g) || []).length;
  if (ticks % 2 === 1) out += "`";

  return out;
}

const cache = new Map();
const MAX_CACHE = 500;

export function renderMarkdown(text, { streaming = false } = {}) {
  if (!text) return "";
  if (streaming) {
    return marked.parse(balanceForStreaming(text)).trim();
  }
  const cached = cache.get(text);
  if (cached !== undefined) return cached;
  const result = marked.parse(text).trim();
  if (cache.size >= MAX_CACHE) cache.clear();
  cache.set(text, result);
  return result;
}
