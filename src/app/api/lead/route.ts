import { Resend } from 'resend';
import { rateLimit } from '@/lib/rate-limit';
import { z } from 'zod';

const resend = new Resend(process.env.RESEND_API_KEY);
const TO_EMAIL = process.env.LEAD_NOTIFY_EMAIL || 'angelyocca@hotmail.com';

const leadSchema = z.object({
  nombre: z.string().min(2).max(100),
  telefono: z.string().min(8).max(30),
  email: z.union([z.string().email(), z.literal('')]).optional(),
  problema: z.string().min(20).max(2000),
});

/** Escape HTML special characters to prevent injection in the notification email. */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export async function POST(req: Request) {
  // SEC: Rate limit by IP — 5 submissions per 15 minutes to prevent spam
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const { success } = await rateLimit(`lead:${ip}`, { maxRequests: 5, windowMs: 15 * 60_000 });
  if (!success) {
    return Response.json({ success: false, error: 'Demasiados intentos. Intentá más tarde.' }, { status: 429 });
  }

  let data: z.infer<typeof leadSchema>;
  try {
    const body = await req.json();
    data = leadSchema.parse(body);
  } catch {
    return Response.json({ success: false, error: 'Datos inválidos' }, { status: 400 });
  }

  const { nombre, telefono, email, problema } = data;

  const { error } = await resend.emails.send({
    from: 'DefensaYa <onboarding@resend.dev>',
    to: TO_EMAIL,
    subject: `Nuevo lead DefensaYa: ${escapeHtml(nombre)}`,
    html: `
      <h2>Nuevo contacto desde DefensaYa</h2>
      <p><strong>Nombre:</strong> ${escapeHtml(nombre)}</p>
      <p><strong>Teléfono:</strong> ${escapeHtml(telefono)}</p>
      ${email ? `<p><strong>Email:</strong> ${escapeHtml(email)}</p>` : ''}
      <hr/>
      <p><strong>Problema:</strong></p>
      <p>${escapeHtml(problema)}</p>
    `,
  });

  if (error) {
    return Response.json({ success: false, error: 'Error interno' }, { status: 500 });
  }
  return Response.json({ success: true });
}
