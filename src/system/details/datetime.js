export const date = new Date().toISOString().split('T')[0];
export const time = new Date().toLocaleTimeString();

export const prompt = `Current Date: ${date} 
Current Time: ${time}`;
