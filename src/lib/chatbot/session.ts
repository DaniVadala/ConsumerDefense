/**
 * Store de sesiones: Redis (Upstash) en producción, Memoria para MVP/Dev.
 */

import { getRedisClient } from '@/lib/redis';
import type { GraphStateType } from './state';

const sessions = new Map<string, {
  state: Partial<GraphStateType>;
  lastAccess: number;
}>();

const SESSION_TTL = 30 * 60; // 30 minutos en segundos

// Limpiar sesiones viejas cada 10 minutos (solo para el fallback en memoria)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    const maxAge = SESSION_TTL * 1000;
    for (const [key, session] of sessions) {
      if (now - session.lastAccess > maxAge) {
        sessions.delete(key);
      }
    }
  }, 10 * 60 * 1000);
}

export async function getSession(sessionId: string): Promise<Partial<GraphStateType> | null> {
  const redis = getRedisClient();
  if (redis) {
    const data = await redis.get(`session:${sessionId}`);
    return data as Partial<GraphStateType> | null;
  }

  const session = sessions.get(sessionId);
  if (session) {
    session.lastAccess = Date.now();
    return session.state;
  }
  return null;
}

export async function saveSession(sessionId: string, state: Partial<GraphStateType>): Promise<void> {
  const redis = getRedisClient();
  if (redis) {
    await redis.set(`session:${sessionId}`, state, { ex: SESSION_TTL });
    return;
  }

  sessions.set(sessionId, {
    state,
    lastAccess: Date.now(),
  });
}

export async function deleteSession(sessionId: string): Promise<void> {
  const redis = getRedisClient();
  if (redis) {
    await redis.del(`session:${sessionId}`);
    return;
  }
  sessions.delete(sessionId);
}
