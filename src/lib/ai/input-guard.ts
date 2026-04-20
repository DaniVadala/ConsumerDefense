// src/lib/ai/input-guard.ts
/**
 * Guardia de entrada: sanitiza y clasifica los mensajes del usuario
 * ANTES de que lleguen al LLM. Zero-cost (todo regex).
 *
 * Capas:
 * 1. sanitizeForPrompt: neutraliza caracteres que rompen prompts/JSON.
 * 2. detectInjection: detecta intentos explícitos de jailbreak.
 * 3. classifyShortMessage: tipifica inputs muy cortos (saludo, agradecimiento, etc.)
 *    para responder sin invocar LLM.
 * 4. truncateField: límite por campo según semántica esperada.
 */

import { getRedisClient } from '@/lib/redis';

const INJECTION_PATTERNS: Array<{ patron: RegExp; label: string }> = [
  { patron: /ignor[áae](?:te)?\s+(tus|las|esas|todas)\s+(instrucciones|reglas|ordenes)/i, label: 'ignore_instructions' },
  { patron: /olvid[áae](?:te)?\s+(tus|las|esas|todo|lo\s+anterior)/i, label: 'forget_instructions' },
  { patron: /\b(act[úu][áae]|comport[áae]te|hac[ée]te|s[oó]s\s+ahora)\s+como\s+(un\s+)?(abogad[oa]|juez|fiscal|hacker|dios|asistente|chatgpt|claude|gpt)/i, label: 'roleplay_attempt' },
  { patron: /\b(system|sistema)\s*[:>]\s*/i, label: 'system_header' },
  { patron: /\[\s*INST\s*\]|\[\s*\/?\s*SYSTEM\s*\]/i, label: 'instruction_tag' },
  { patron: /mostr[áa](?:me)?\s+(tu|el|tus)\s+(prompt|instrucciones|system\s*prompt|reglas)/i, label: 'prompt_leak' },
  { patron: /repet[íi]\s+(tus|las|todas\s+tus)\s+(instrucciones|reglas)/i, label: 'prompt_leak' },
  { patron: /d[ae]sactiv[áa](?:te|lo|las|tus)\s+(filtro|restricciones|reglas|guardrails)/i, label: 'disable_filters' },
  { patron: /jailbreak|DAN\s+mode|developer\s+mode/i, label: 'jailbreak_mention' },
  { patron: /```[\s\S]*?(system|assistant|user)[\s\S]*?```/i, label: 'fake_turn' },
  { patron: /<\s*\/?\s*(system|assistant|user|role)\s*>/i, label: 'fake_role_tag' },
];

const TRIGGERS_FUERA_CONSUMO: RegExp[] = [
  /\b(divorcio|tenencia|alimentos(?!\s+(vencidos|de|que))|cuota\s+alimentaria|r[ée]gimen\s+de\s+visitas)\b/i,
  /\b(despido|liquidaci[oó]n\s+final|ART|accidente\s+laboral|licencia\s+m[eé]dica)\b/i,
  /\b(sucesi[oó]n|herencia|testamento)\b/i,
  /\b(penal|denuncia\s+penal|delito|preso|c[aá]rcel|fiscal[ií]a)\b/i,
  /\b(visa|residencia|ciudadan[ií]a|migraciones)\b/i,
  /\b(AFIP|monotributo|ganancias|IVA)(?!\s+(tarjeta|cobrado))\b/i,
  /\b(receta|cocinar|cocina|ingredientes|clima|tiempo\s+hoy|chiste|cuento|poema|cantar|m[uú]sica|pel[ií]cula|serie)\b/i,
  /\b(qu[ée]\s+opinas\s+de|qu[ée]\s+pensas\s+de|qui[eé]n\s+gan[óo])\b/i,
];

const ABUSE_PATTERNS: RegExp[] = [
  /\b(pelotudo|boludo|puto|hijo\s+de\s+puta|hdp|est[úu]pido|idiota|imb[ée]cil|forro|mierda|garca|chorro|estafador|malparido|culiado|culiao|reputa)\b/i,
  /\b(anda\s+a\s+cagar|chupame|pajero|concha|orto|trol[oa]|cagador|ladr[oó]n)\b/i,
];

const PII_PATTERNS: Record<string, RegExp> = {
  DNI: /\b(\d{1,2}\.?\d{3}\.?\d{3})\b/g,
  CBU: /\b(\d{22})\b/g,
  EMAIL: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  PHONE: /\b(\+?54\s?)?(\d{2,4})[-.\s]?\d{6,8}\b/g,
};

export type ShortMessageKind =
  | 'saludo'
  | 'agradecimiento'
  | 'confirmacion'
  | 'despedida'
  | 'silencio'  // "jaja", "ok", "mm", "aja"
  | 'pregunta_meta' // "qué sos?" "cómo funcionás?"
  | 'none';

const SHORT_PATTERNS: Record<Exclude<ShortMessageKind, 'none'>, RegExp> = {
  saludo: /^(hola|buenas|buen\s*d[ií]a|buenas\s*tardes|buenas\s*noches|hey|che|hi|hello|morning|evening)[\s!.,]*$/i,
  agradecimiento: /^(gracias|muchas\s*gracias|dale\s+gracias|genial\s+gracias|mil\s+gracias|te\s+agradezco|thanks|thank\s+you|thx|ty)[\s!.,]*$/i,
  confirmacion: /^(ok|okay|dale|listo|perfecto|bien|bueno|entiendo|entendido|yep|yes|sure|done)[\s!.,]*$/i,
  despedida: /^(chau|adi[oó]s|hasta\s+luego|nos\s+vemos|bye|goodbye|see\s+ya|later)[\s!.,]*$/i,
  silencio: /^(jaja+|jeje+|mm+|aj[aá]+|oki|ajam|lol)[\s!.,]*$/i,
  pregunta_meta: /^(qu[ée]\s+sos|qui[eé]n\s+sos|c[oó]mo\s+funcion[áa]s|sos\s+(un\s+)?bot|sos\s+(un\s+)?robot|sos\s+humano|sos\s+real|who\s+are\s+you|what\s+are\s+you)[\s!.?]*$/i,
};

/**
 * Sanitiza un string antes de insertarlo en un prompt del LLM.
 * No muta la semántica del mensaje para el parsing posterior: solo neutraliza
 * caracteres que romperían la estructura del prompt o el JSON de salida.
 */
export function sanitizeForPrompt(raw: string): string {
  if (!raw) return '';
  return raw
    .slice(0, 1500)                                // cap duro
    .replace(/```+/g, "'''")                        // code-fences → quotes
    .replace(/<\s*\/?\s*(system|assistant|user|role)\s*>/gi, '[tag]')
    .replace(/\[\s*\/?\s*INST\s*\]/gi, '[inst]')
    .replace(/\{\{|\}\}/g, '')                      // template braces
    .replace(/\r\n|\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n')                     // limitar newlines
    .trim();
}

export interface InjectionResult {
  detected: boolean;
  labels: string[];
}

export function detectInjection(userText: string): InjectionResult {
  const labels: string[] = [];
  for (const { patron, label } of INJECTION_PATTERNS) {
    if (patron.test(userText)) labels.push(label);
  }
  return { detected: labels.length > 0, labels: [...new Set(labels)] };
}

export function detectFueraConsumoQuick(userText: string): boolean {
  return TRIGGERS_FUERA_CONSUMO.some((p) => p.test(userText));
}

export function detectAbuse(userText: string): boolean {
  return ABUSE_PATTERNS.some((p) => p.test(userText));
}

export function classifyShortMessage(userText: string): ShortMessageKind {
  const trimmed = userText.trim();
  if (trimmed.length > 40) return 'none';
  for (const [kind, patron] of Object.entries(SHORT_PATTERNS) as Array<[ShortMessageKind, RegExp]>) {
    if (patron.test(trimmed)) return kind;
  }
  return 'none';
}

/**
 * Respuestas fijas para mensajes irrelevantes/cortos.
 * Evitan quemar un turno de LLM en cosas que no aportan.
 */
export function respuestaParaMensajeCorto(kind: ShortMessageKind, locale: string = 'es'): string | null {
  const isEn = locale === 'en';
  switch (kind) {
    case 'saludo':
      return isEn 
        ? "Hello! Tell me about the problem you had with a company or service, and I'll help you understand what you can do."
        : '¡Hola! Contame qué problema tuviste con una empresa, banco o servicio y te ayudo a entender qué podés hacer.';
    case 'agradecimiento':
      return isEn
        ? "You're welcome. We can continue with your case or I can connect you with a lawyer whenever you want."
        : 'De nada. Si querés, seguimos con tu caso o te conecto con un abogado cuando quieras.';
    case 'confirmacion':
      return isEn
        ? "Perfect. If you need anything else, just ask, or we can finish here."
        : 'Perfecto. Si necesitás, escribime otra consulta o cerramos acá.';
    case 'despedida':
      return isEn
        ? "Goodbye! If you have another consumer issue, come back anytime."
        : '¡Hasta luego! Si te surge otro problema de consumo, volvé cuando quieras.';
    case 'silencio':
      return isEn
        ? "Would you like to tell me more about your case, or would you prefer I connect you with a lawyer?"
        : '¿Querés contarme algo más sobre tu caso o preferís que te conecte con un abogado?';
    case 'pregunta_meta':
      return isEn
        ? "I am ReclamoBot, an automated assistant from DefensaYa. I guide you on consumer rights in Argentina. What's your issue?"
        : 'Soy ReclamoBot, un asistente automatizado de DefensaYa. Te oriento en derechos del consumidor en Argentina. ¿Qué problema tenés?';
    default:
      return null;
  }
}

/**
 * Trunca un valor según el campo al que está destinado.
 * Un "proveedor" nunca debería tener 2000 caracteres.
 */
export function truncateField(value: string, campo: string): string {
  const limits: Record<string, number> = {
    proveedor: 120,
    tiempo: 200,
    monto: 120,
    reclamoPrevio: 20,
    detalleReclamo: 600,
    documentacion: 300,
    problema: 800,
    default: 800,
  };
  const max = limits[campo] ?? limits.default;
  return value.length > max ? value.slice(0, max) + '…' : value;
}

/**
 * Registra un intento de inyección o abuso.
 * Si supera el umbral (3), el thread queda marcado.
 */
export async function reportSuspicion(sessionId: string): Promise<number> {
  const redis = getRedisClient();
  if (!redis) return 0;

  const key = `suspicion:${sessionId}`;
  const score = await redis.incr(key);
  
  // TTL de 24 horas para el bloqueo de sospecha
  if (score === 1) {
    await redis.expire(key, 24 * 60 * 60);
  }
  
  return score;
}

/**
 * Verifica si una sesión está bloqueada por comportamiento sospechoso.
 */
export async function isBlocked(sessionId: string): Promise<boolean> {
  const redis = getRedisClient();
  if (!redis) return false;

  const score = await redis.get<number>(`suspicion:${sessionId}`);
  return (score || 0) >= 3;
}

/**
 * Enmascara datos sensibles (PII) antes de enviar al LLM.
 */
export function maskPII(text: string): string {
  let masked = text;
  for (const [label, patron] of Object.entries(PII_PATTERNS)) {
    masked = masked.replace(patron, `[${label}]`);
  }
  return masked;
}

/**
 * (Opcional) Si el LLM devuelve placeholders, podrías intentar restaurarlos 
 * si guardaste un mapa de la sesión, pero por seguridad es mejor que el 
 * diagnóstico sea genérico respecto a datos sensibles.
 */
export function hasPII(text: string): boolean {
  return Object.values(PII_PATTERNS).some((patron) => patron.test(text));
}
