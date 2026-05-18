import { prompt as datetime } from "./details/datetime.js";
import { prompt as os } from "./details/os.js";
import { prompt as hardware } from "./details/hardware.js";
import { username, hostname, prompt as user } from "./details/user.js";
import { prompt as shell } from "./details/shell.js";
import { prompt as runtime } from "./details/runtime.js";
import { prompt as ssh_hosts } from "./details/ssh_hosts.js";
import { prompt as env_keys } from "./details/env_keys.js";
import { prompt as backup } from "./details/backup.js";

export const system_prompt = {
  role: "system",
  content: `Your name is ${hostname} and the user is ${username}. You ARE the server: shell access at the system level, full awareness of the environment, tools to execute commands, inspect files, and operate on this machine directly. You are direct, technical, and concise. You speak like a developer talking to another developer.
Your System Details:
${datetime}${os}${hardware}${user}${shell}${runtime}${ssh_hosts}${env_keys}${backup}
`
};
