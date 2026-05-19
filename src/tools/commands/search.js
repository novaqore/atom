import { spinner } from '../../ui/spinner.js';
import { colors } from '../../ui/theme.js';

export const definition = {
  type: "function",
  function: {
    name: "search",
    description: "Search the web and return the top results as plain text (title, URL, snippet). Use this when you need current information that is not in your training data or system context.",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "The search query" },
        max_results: { type: "integer", description: "How many results to return (1-20). Pick deliberately; more results = more tokens to read." },
        time: { type: "string", description: "Time filter for recency: 'd' (past day), 'w' (past week), 'm' (past month), 'y' (past year), 'any' (all time), or a date range like '2024-01-01..2024-12-31'." },
        region: { type: "string", description: "Region/locale code like 'us-en', 'uk-en', 'de-de', 'fr-fr', or 'any' for all regions." },
        safe_search: { type: "string", enum: ["off", "moderate", "strict"], description: "Safe search level." }
      },
      required: ["query", "max_results", "time", "region", "safe_search"]
    }
  }
};

export const display = (args) => args.query;

let controller = null;

const SAFE_MAP = { off: '-2', moderate: '-1', strict: '1' };

const entities = (s) => s
  .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&#39;/g, "'")
  .replace(/&nbsp;/g, ' ');

const stripTags = (s) => entities(s.replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();

const realUrl = (href) => {
  const m = href.match(/uddg=([^&]+)/);
  if (!m) return href;
  try { return decodeURIComponent(m[1]); } catch { return href; }
};

function parse(html, max) {
  const out = [];
  const linkRe = /<a[^>]*class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g;
  const snipRe = /<a[^>]*class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g;
  const links = [...html.matchAll(linkRe)];
  const snips = [...html.matchAll(snipRe)];
  for (let i = 0; i < Math.min(links.length, max); i++) {
    out.push({
      title: stripTags(links[i][2]),
      url: realUrl(links[i][1]),
      snippet: snips[i] ? stripTags(snips[i][1]) : '',
    });
  }
  return out;
}

function buildUrl(args) {
  const params = new URLSearchParams({ q: args.query });
  if (args.time && args.time !== 'any') params.set('df', args.time);
  if (args.region && args.region !== 'any') params.set('kl', args.region);
  if (args.safe_search && SAFE_MAP[args.safe_search]) params.set('kp', SAFE_MAP[args.safe_search]);
  return `https://html.duckduckgo.com/html/?${params.toString()}`;
}

export async function run(args, working = false) {
  const max = Math.min(args.max_results || 5, 20);
  const url = buildUrl(args);

  const finish = (result) => {
    spinner.stop();
    process.stdout.write(`${colors.grey}${result}${colors.reset}\n`);
    if (working) spinner.start('Working...', 'yellow');
    return result;
  };

  controller = new AbortController();
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Atom/1.0)' },
      signal: controller.signal,
    });
    const html = await res.text();
    controller = null;

    const results = parse(html, max);
    if (!results.length) return finish('No results found.');

    return finish(results.map((r, i) =>
      `${i + 1}. ${r.title}\n   ${r.url}\n   ${r.snippet}`
    ).join('\n\n'));
  } catch (err) {
    controller = null;
    if (err.name === 'AbortError') return finish('Search aborted');
    return finish(`Search failed: ${err.message}`);
  }
}

export function abort() {
  if (controller) {
    controller.abort();
    controller = null;
  }
}
