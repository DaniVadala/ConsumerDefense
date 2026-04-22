import { ConversationState, ConversationStateSchema, FieldsCollectedSchema } from './schemas';
import { SESSION_TTL_SECONDS } from './config';

// ---------------------------------------------------------------------------
// Storage backend — Redis in production, in-memory Map in local dev
// ---------------------------------------------------------------------------
const inMemoryStore = new Map<string, string>();

const isRedisConfigured =
  typeof process.env.UPSTASH_REDIS_REST_URL === 'string' &&
  process.env.UPSTASH_REDIS_REST_URL.length > 0;

// Lazy-load Redis only when env vars are present to avoid startup crashes
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let redis: any = null;
if (isRedisConfigured) {
  // Dynamic require so that missing env vars don't throw at module parse time
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Redis } = require('@upstash/redis') as typeof import('@upstash/redis');
  redis = Redis.fromEnv();
}

async function storeGet(key: string): Promise<unknown | null> {
  if (redis) return redis.get(key);
  const raw = inMemoryStore.get(key);
  return raw ? JSON.parse(raw) : null;
}

async function storeSet(key: string, value: unknown, _ttl: number): Promise<void> {
  if (redis) { await redis.set(key, value, { ex: _ttl }); return; }
  inMemoryStore.set(key, JSON.stringify(value));
}

async function storeDel(key: string): Promise<void> {
  if (redis) { await redis.del(key); return; }
  inMemoryStore.delete(key);
}

// Keep SESSION_TTL_SECONDS used (avoids lint warning when Redis is off)
void SESSION_TTL_SECONDS;

const sessionKey = (sessionId: string) => `chatbot:session:${sessionId}`;

/** Read a session from Redis (or in-memory). Returns null if not found. */
export async function getSession(sessionId: string): Promise<ConversationState | null> {
  const raw = await storeGet(sessionKey(sessionId));
  if (!raw) return null;

  const parsed = ConversationStateSchema.safeParse(raw);
  if (!parsed.success) {
    console.error('[redis-session] Invalid state in store:', parsed.error.issues);
    return null;
  }
  return parsed.data;
}

/** Persist a conversation state, resetting the TTL. */
export async function saveSession(state: ConversationState): Promise<void> {
  const validated = ConversationStateSchema.parse({
    ...state,
    updatedAt: new Date().toISOString(),
  });
  await storeSet(sessionKey(state.sessionId), validated, SESSION_TTL_SECONDS);
}

/** Delete a session (used for testing or explicit resets). */
export async function resetSession(sessionId: string): Promise<void> {
  await storeDel(sessionKey(sessionId));
}

/** Create a brand-new empty session state. */
export function createInitialState(sessionId: string): ConversationState {
  const now = new Date().toISOString();
  return {
    sessionId,
    currentStep: 'greeting',
    fieldsCollected: FieldsCollectedSchema.parse({}),
    nonConducentCount: 0,
    stuckCount: 0,
    conversationSummary: '',
    createdAt: now,
    updatedAt: now,
    turnCount: 0,
  };
}
