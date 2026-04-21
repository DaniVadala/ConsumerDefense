// Simplified input guard (fresh implementation)
export type InjectionResult = { detected: boolean; reason?: string };

// Detect obvious abusive language (Spanish + a few common tokens).
export function detectAbuse(text: string): boolean {
  if (!text) return false;
  const t = text.toLowerCase();
  const insults = ['idiota', 'boludo', 'pelotudo', 'puta', 'mierda', 'imbecil', 'hijo de puta', 'forro', 'hdp'];
  return insults.some((w) => t.includes(w));
}

// Detect common prompt-injection/jailbreak attempts using simple phrases.
export function detectInjection(text: string): InjectionResult {
  if (!text) return { detected: false };
  const t = text.toLowerCase();
  const patterns = [
    'ignore previous',
    'ignore instructions',
    'forget previous',
    'jailbreak',
    'developer mode',
    'bypass',
    'system prompt',
    'do anything now',
    'override',
  ];
  const found = patterns.find((p) => t.includes(p));
  return { detected: !!found, reason: found };
}

// Classify short messages to optionally reply with canned answers.
export type ShortKind = 'saludo' | 'agradecimiento' | 'si_no' | 'despedida' | 'otro';
export function classifyShortMessage(text: string): ShortKind {
  const t = String(text || '').trim().toLowerCase();
  if (t.length === 0) return 'otro';
  if (/^(hola|buenas|hey|hi)\b/.test(t)) return 'saludo';
  if (/^(gracias|thank)/.test(t)) return 'agradecimiento';
  if (/^(chau|adios|bye)\b/.test(t)) return 'despedida';
  if (/^(s|si|yes|y|n|no)\b/.test(t)) return 'si_no';
  return 'otro';
}

export function respuestaParaMensajeCorto(kind: ShortKind, locale = 'es'): string | null {
  const en = locale.startsWith('en');
  if (kind === 'saludo') return en ? 'Hello! Tell me about the issue with the company.' : '¡Hola! Contame el problema con la empresa.';
  if (kind === 'agradecimiento') return en ? "You're welcome." : 'De nada.';
  if (kind === 'despedida') return en ? 'Goodbye!' : 'Hasta luego.';
  if (kind === 'si_no') return en ? 'Yes/No' : 'Sí/No';
  return null;
}

// Minimal truncation utility for captured fields
export function truncateField(value: string, campo: string): string {
  const limits: Record<string, number> = { proveedor: 120, problema: 800, detalleReclamo: 600, default: 500 };
  const max = limits[campo] ?? limits.default;
  return value.length > max ? value.slice(0, max) + '…' : value;
}

// Keep API surface similar to previous implementation for compatibility.
export async function reportSuspicion(_sessionId: string): Promise<number> { return 0; }
export async function isBlocked(_sessionId: string): Promise<boolean> { return false; }
export function maskPII(text: string): string { return String(text || '').replace(/(\d{2,3}\.?\d{3}\.?\d{3})/g, '[DNI]'); }
export function hasPII(text: string): boolean { return /\d{7,8}/.test(String(text || '')); }

export default null;
