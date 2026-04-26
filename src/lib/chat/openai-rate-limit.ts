/**
 * Detecta límites de tasa o capacidad (429 / TPM) del proveedor de modelos, no el rate limit
 * de la propia app (Eso se trata con makeEscalationStream en el route).
 */
export function isOpenAiRateLimitError(err: unknown): boolean {
  if (err == null) return false;
  if (typeof err === 'string') {
    return /rate limit|rate_limit|too many requests|tpm|tokens per (min|minute)/i.test(err);
  }
  if (typeof err !== 'object') return false;
  const e = err as Record<string, unknown>;
  if (e.statusCode === 429 || e.status === 429) return true;
  const code = e.code;
  if (code === 'rate_limit_exceeded' || code === 'rate_limit' || code === 'too_many_requests') return true;
  const name = String(e.name ?? '');
  if (/rate|RateLimit|Overloaded|Throttl/i.test(name)) return true;
  const msg = String(e.message ?? '');
  if (/rate limit|rate_limit|too many requests|tpm|tokens per (min|minute)/i.test(msg)) return true;
  if (e.data && typeof e.data === 'object' && e.data) return isOpenAiRateLimitError(e.data);
  if (e.error && typeof e.error === 'object' && e.error) return isOpenAiRateLimitError(e.error);
  if (e.cause) return isOpenAiRateLimitError(e.cause);
  if (e.response) return isOpenAiRateLimitError(e.response);
  return false;
}

export const OPENAI_RATE_LIMIT_USER_MESSAGE =
  'Hay mucho tráfico en este momento. Por favor, intentá de nuevo en un rato. Si la consulta no puede esperar, podés continuar por WhatsApp.';
