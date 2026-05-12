import prompts from 'prompts';
import { saveEnv } from '../utils/envs.js';

export async function setup() {
  const res = await prompts([
    { type: 'password', name: 'uid', message: 'Enter NOVAQORE_UID' },
    { type: 'password', name: 'keyId', message: 'Enter NOVAQORE_KEY_ID' },
    { type: 'password', name: 'quantumKey', message: 'Enter NOVAQORE_QUANTUM_KEY' }
  ]);

  if (res.uid && res.keyId && res.quantumKey) {
    saveEnv({
      NOVAQORE_UID: res.uid,
      NOVAQORE_KEY_ID: res.keyId,
      NOVAQORE_QUANTUM_KEY: res.quantumKey
    });
  }
}