/** Modelo fijo del chat (API `/api/chat`). */
export const DEFAULT_MODEL = 'gpt-4o';

/** Respuestas largas (p. ej. análisis preliminar) — evitar corte. */
export const MAX_TOKENS = 8000;

export const MAX_USER_MESSAGE_LENGTH = 5000;

export const TEMPERATURE = 0.4;

export const CHAT_TEMPERATURE = 0.2;

export const PROVIDER_OPTIONS = {
  openai: {
    parallelToolCalls: false,
  },
} as const;
