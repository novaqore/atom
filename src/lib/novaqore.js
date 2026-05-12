import NovaQoreAI from "@novaqore/ai";
import { loadEnv } from '../utils/envs.js';

const env = loadEnv();

export const nq = env ? new NovaQoreAI({
  uid: env.NOVAQORE_UID,
  quantumKey: env.NOVAQORE_QUANTUM_KEY,
  keyId: env.NOVAQORE_KEY_ID,
}) : null;