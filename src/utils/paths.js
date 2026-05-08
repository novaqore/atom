import { homedir } from "node:os";
import { join } from "node:path";

export const ATOM_DIR = join(homedir(), ".atom");
export const SERVICE_FILE = join(ATOM_DIR, "novaqore-ai-service.json");
