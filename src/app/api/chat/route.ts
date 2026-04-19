import { createGroq } from '@ai-sdk/groq';
import { streamText, convertToModelMessages, UIMessage } from 'ai';
import { getSystemPrompt } from '@/lib/ai/system-prompt';
import { reclamobotTools } from '@/lib/ai/tools';
import { rateLimit } from '@/lib/rate-limit';
import { z } from 'zod';

export const maxDuration = 30;

const MAX_MESSAGES = 50;
const MAX_CONTENT_LENGTH = 2000;

const messageSchema = z.object({
  messages: z
    .array(
      z.object({
        id: z.string(),
        // UIMessage v6 stores content in parts (no top-level content/role fields)
        parts: z
          .array(
            z.object({
              type: z.string(),
              text: z.string().max(MAX_CONTENT_LENGTH).optional(),
            }).passthrough()
          )
          .optional(),
      }).passthrough()
    )
    .max(MAX_MESSAGES),
});

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

// Use GROQ_MODEL env var to override — set llama-3.3-70b-versatile in Vercel for production
const GROQ_MODEL = process.env.GROQ_MODEL ?? 'llama-3.1-8b-instant';

export async function POST(req: Request) {
  // SEC: Rate limit by IP — 20 requests per minute per client
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const { success } = await rateLimit(`chat:${ip}`, { maxRequests: 20, windowMs: 60_000 });
  if (!success) {
    return Response.json({ error: 'Too many requests' }, { status: 429 });
  }

  let parsed: z.infer<typeof messageSchema>;
  try {
    const body = await req.json();
    parsed = messageSchema.parse(body);
  } catch {
    return Response.json({ error: 'Invalid request' }, { status: 400 });
  }

  const validMessages = (parsed.messages as unknown as UIMessage[]).filter(
    (m) => m.role === 'user' || m.role === 'assistant',
  );

  const result = streamText({
    model: groq(GROQ_MODEL),
    system: getSystemPrompt(),
    messages: await convertToModelMessages(validMessages),
    tools: reclamobotTools,
    maxOutputTokens: 4096,
  });

  return result.toUIMessageStreamResponse({
    onError(err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.toLowerCase().includes('rate limit') || msg.toLowerCase().includes('quota')) {
        return 'quota_exceeded';
      }
      return 'Error al procesar tu mensaje.';
    },
  });
}
