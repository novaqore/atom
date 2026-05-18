import os from 'os';

export const username = os.userInfo().username;
export const hostname = os.hostname();
export const homedir = os.homedir();

export const prompt = `Username: ${username}
Hostname: ${hostname}
Home Directory: ${homedir}
Current Working Directory: ${process.cwd()}`;
