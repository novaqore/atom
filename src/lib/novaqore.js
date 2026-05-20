import NovaQoreAI from "@novaqore/ai";
import { loadEnv } from "../config/env.js";
export const url = loadEnv()?.NOVAQORE_INTERNAL_URL;
export const ai = new NovaQoreAI(url ? { base_url: url } : {});