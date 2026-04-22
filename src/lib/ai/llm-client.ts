/**
 * Provider-agnostic LLM client.
 *
 * To switch providers, set these env vars (no code changes needed):
 *   LLM_PROVIDER = gemini | groq          (default: gemini)
 *   LLM_MODEL    = <any model name>        (default: per-provider below)
 *
 * To add a new provider, implement the LLMAdapter interface below and
 * register it in the ADAPTERS map.
 */

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface LLMResult {
  /** Raw text returned by the model (JSON string in our case). */
  rawContent: string;
  /** HTTP status of the underlying API call. */
  status: number;
  /** True when the model returned a non-2xx that should be treated as high-traffic. */
  failed: boolean;
}

interface LLMAdapter {
  defaultModel: string;
  envKey: string;
  call(apiKey: string, model: string, systemPrompt: string, messages: ChatMessage[]): Promise<LLMResult>;
}

// ---------------------------------------------------------------------------
// Gemini adapter
// ---------------------------------------------------------------------------
const geminiAdapter: LLMAdapter = {
  defaultModel: 'gemini-2.0-flash',
  envKey: 'GOOGLE_GENERATIVE_AI_API_KEY',

  async call(apiKey, model, systemPrompt, messages) {
    const contents = messages
      .map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }))
      .filter((_, i, arr) => i > 0 || arr[0].role === 'user');

    const body = {
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: contents.length > 0 ? contents : [{ role: 'user', parts: [{ text: '.' }] }],
      generationConfig: { responseMimeType: 'application/json', temperature: 0.3, maxOutputTokens: 900 },
    };

    const doFetch = () =>
      fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

    let res = await doFetch();
    if (res.status === 429) {
      await new Promise((r) => setTimeout(r, 4000));
      res = await doFetch();
    }

    if (!res.ok) {
      const err = await res.text().catch(() => 'unknown');
      console.error(`Gemini API error ${res.status}:`, err);
      return { rawContent: '', status: res.status, failed: true };
    }

    const data = await res.json().catch(() => null);
    const rawContent: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    return { rawContent, status: res.status, failed: false };
  },
};

// ---------------------------------------------------------------------------
// Groq adapter (kept as fallback / alternative)
// ---------------------------------------------------------------------------
const groqAdapter: LLMAdapter = {
  defaultModel: 'llama-3.3-70b-versatile',
  envKey: 'GROQ_API_KEY',

  async call(apiKey, model, systemPrompt, messages) {
    const groqMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
    ];

    const doFetch = (m: string) =>
      fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ model: m, messages: groqMessages, temperature: 0.3, max_tokens: 900, response_format: { type: 'json_object' } }),
      });

    let res = await doFetch(model);

    if (res.status === 429) {
      const errBody = await res.json().catch(() => null);
      const errMsg = String(errBody?.error?.message ?? '');
      const waitSecMatch = errMsg.match(/try again in (\d+(?:\.\d+)?)s/);
      const waitMs = waitSecMatch ? Math.ceil(parseFloat(waitSecMatch[1]) * 1000) : 2000;
      const isTPD = errMsg.includes('tokens per day');

      if (isTPD || waitMs > 5000) {
        res = await doFetch('llama-3.1-8b-instant');
      } else {
        await new Promise((r) => setTimeout(r, waitMs + 300));
        res = await doFetch(model);
        if (res.status === 429) res = await doFetch('llama-3.1-8b-instant');
      }
    }

    if (!res.ok) {
      const err = await res.text().catch(() => 'unknown');
      console.error(`Groq API error ${res.status}:`, err);
      return { rawContent: '', status: res.status, failed: true };
    }

    const data = await res.json().catch(() => null);
    const rawContent: string = data?.choices?.[0]?.message?.content ?? '';
    return { rawContent, status: res.status, failed: false };
  },
};

// ---------------------------------------------------------------------------
// Registry & public API
// ---------------------------------------------------------------------------
const ADAPTERS: Record<string, LLMAdapter> = {
  gemini: geminiAdapter,
  groq: groqAdapter,
};

/**
 * Call the configured LLM provider. If the primary fails (quota/network),
 * automatically falls back to Groq so the chatbot stays live.
 *
 * Configure via env vars — no code changes needed:
 *   LLM_PROVIDER = gemini | groq   (default: gemini)
 *   LLM_MODEL    = <model name>    (default: per-provider)
 */
export async function callLLM(
  systemPrompt: string,
  messages: ChatMessage[],
): Promise<LLMResult> {
  const providerName = (process.env.LLM_PROVIDER ?? 'gemini').toLowerCase();
  const primaryAdapter = ADAPTERS[providerName] ?? geminiAdapter;

  const primaryKey = process.env[primaryAdapter.envKey];
  if (!primaryKey) throw new Error(`${primaryAdapter.envKey} is not set`);

  const model = process.env.LLM_MODEL ?? primaryAdapter.defaultModel;
  const result = await primaryAdapter.call(primaryKey, model, systemPrompt, messages);

  // Auto-fallback to Groq when primary fails (quota exhausted, network error, etc.)
  if (result.failed && providerName !== 'groq') {
    const groqKey = process.env[groqAdapter.envKey];
    if (groqKey) {
      console.warn(`[llm-client] Primary (${providerName}) failed — falling back to Groq`);
      return groqAdapter.call(groqKey, groqAdapter.defaultModel, systemPrompt, messages);
    }
  }

  return result;
}
