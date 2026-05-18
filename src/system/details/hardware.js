import os from 'os';

const cpuCount = os.cpus().length;
const totalMem = (os.totalmem() / (1024 ** 3)).toFixed(1);

export const prompt = `CPUs: ${cpuCount}  
RAM: ${totalMem}GB\n`;
