import os from 'os';

export const platform = os.platform();
export const arch = os.arch();

export const prompt = `OS: ${os.type()} ${os.release()}
Platform: ${platform}
Architecture: ${arch}\n`;
