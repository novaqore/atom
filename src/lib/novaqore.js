import NovaQoreAI from "@novaqore/ai";
import { loadEnv } from "../config/env.js";

let client = null;
let lastUrl = null;

function getClient() {
  const url = loadEnv()?.NOVAQORE_INTERNAL_URL;
  if (url !== lastUrl) {
    client = new NovaQoreAI(url ? { base_url: url } : {});
    lastUrl = url;
  }
  return client;
}

export const chat = (...args) => getClient().chat(...args);

export function getInternalUrl() {
  return loadEnv()?.NOVAQORE_INTERNAL_URL;
}

