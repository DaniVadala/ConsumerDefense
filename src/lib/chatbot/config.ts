// Chatbot configuration constants

/** Default LLM model (cheapest — used for all phases except diagnosis) */
export const DEFAULT_MODEL = process.env.OPENAI_MODEL ?? 'gpt-4o-mini';

/** Higher-quality model used only for the final diagnosis generation */
export const DIAGNOSIS_MODEL = 'gpt-4o';

/** Maximum tokens the LLM can emit per response */
export const MAX_TOKENS = 2000;

/** Redis TTL for conversation sessions (24 hours in seconds) */
export const SESSION_TTL_SECONDS = 60 * 60 * 24;

/** Maximum number of non-conducent responses before escalating to fallback */
export const MAX_NON_CONDUCENT = 3;

/** Number of recent messages to include verbatim in context (the rest is summarized) */
export const RECENT_MESSAGES_IN_CONTEXT = 2;

/** Maximum character length of an incoming user message (truncated beyond this) */
export const MAX_USER_MESSAGE_LENGTH = 5000;

/** LLM temperature */
export const TEMPERATURE = 0.4;

/** Fields required before a diagnosis can be generated */
export const REQUIRED_FIELDS_FOR_DIAGNOSIS: Array<string> = [
  'description',
  'company',
  'incidentDate',
  'hasPriorClaim',
  'hasDocumentation',
  'amount',
];
