import NovaQoreAI from "@novaqore/ai";
import { loadEnv } from "../utils/env.js";

const env = loadEnv();

export const internalUrl = env?.NOVAQORE_INTERNAL_URL;
export const { chat } = new NovaQoreAI(internalUrl ? { base_url: internalUrl } : {});
