const keys = Object.keys(process.env).sort();

export const prompt = `Available env vars (values hidden, use as-is in shell commands so the shell expands at runtime):
${keys.length ? keys.map(k => `- $${k}`).join('\n') : '- none'}`;
