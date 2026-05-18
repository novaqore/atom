import path from 'path';

const shellPath = process.env.SHELL || process.env.COMSPEC;

export const shell = shellPath || 'unknown';
export const shellName = shellPath ? path.basename(shellPath, path.extname(shellPath)) : 'shell';

export const prompt = `Shell: ${shell}`;
