import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

let cached: string | null = null;

/**
 * Base instructions for the consumer-law assistant (single Markdown source of truth).
 * Cached in memory for the lifetime of the server process.
 */
export async function loadChatInstructions(): Promise<string> {
  if (cached) return cached;
  const path = join(process.cwd(), 'src/lib/prompts/consumidor-chat-instructions.md');
  cached = await readFile(path, 'utf-8');
  return cached;
}
