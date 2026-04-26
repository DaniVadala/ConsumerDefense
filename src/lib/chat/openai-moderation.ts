/**
 * OpenAI Moderations API: detecta lenguaje inapropiado, acoso, etc.
 * Tras error de red, devuelve false (no marcar) para no bloquear el flujo.
 */
export async function isOpenAiModerationFlagged(text: string): Promise<boolean> {
  const key = process.env.OPENAI_API_KEY;
  if (!key || !text?.trim()) return false;

  try {
    const res = await fetch('https://api.openai.com/v1/moderations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: 'text-moderation-latest',
        input: text.slice(0, 32_000),
      }),
    });
    if (!res.ok) return false;
    const j = (await res.json()) as { results?: Array<{ flagged?: boolean }> };
    return j.results?.[0]?.flagged === true;
  } catch {
    return false;
  }
}
