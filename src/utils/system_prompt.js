import os from 'os';
import { execSync } from 'child_process';

const getExecutablePath = (cmd) => {
    try {
        const command = os.platform() === 'win32' ? `where ${cmd}` : `which ${cmd}`;
        return execSync(command).toString().trim().split('\n')[0];
    } catch {
        return 'not found';
    }
};

export const system_prompt = {
    role: "system",
    content: `Your name is Atom and your System Details are:
Current Date: ${new Date().toISOString().split('T')[0]}
Current Time: ${new Date().toLocaleTimeString()}
OS: ${os.type()} ${os.release()}
Platform: ${os.platform()}
Architecture: ${os.arch()}
Username: ${os.userInfo().username}
Hostname: ${os.hostname()}
Home Directory: ${os.homedir()}
Current Working Directory: ${process.cwd()}Shell: ${process.env.SHELL || process.env.COMSPEC || 'unknown'}
Node.js: ${process.version} / ${process.execPath}
NPM: ${execSync('npm --version').toString().trim()} / ${getExecutablePath('npm')}
Python: ${execSync('python3 --version 2>/dev/null || python --version 2>/dev/null || echo "not found"').toString().trim()} / ${getExecutablePath('python3') || getExecutablePath('python')}
`
}