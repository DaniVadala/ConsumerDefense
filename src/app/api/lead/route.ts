import { NextRequest } from 'next/server';
import { z } from 'zod';
import { Resend } from 'resend';
import { extractClientIp } from '@/lib/rate-limiter';

const LeadSchema = z.object({
  nombre: z.string().min(2).max(100),
  telefono: z.string().min(8).max(30),
  email: z.union([z.email(), z.literal('')]).optional(),
  problema: z.string().min(20).max(4000),
});

// Simple in-memory rate limiter: 5 submissions per IP per 15 minutes
const submissionWindow = 15 * 60 * 1000;
const maxSubmissions = 5;
const submissions = new Map<string, { count: number; windowStart: number }>();

function checkLeadRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = submissions.get(ip);
  if (!entry || now - entry.windowStart > submissionWindow) {
    submissions.set(ip, { count: 1, windowStart: now });
    return true;
  }
  if (entry.count >= maxSubmissions) return false;
  entry.count++;
  return true;
}

export async function POST(req: NextRequest) {
  const ip = extractClientIp(req);

  if (!checkLeadRateLimit(ip)) {
    return Response.json({ error: 'Demasiadas solicitudes. Intentá más tarde.' }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Solicitud inválida' }, { status: 400 });
  }

  const parsed = LeadSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: 'Datos inválidos', details: parsed.error.flatten() }, { status: 400 });
  }

  const { nombre, telefono, email, problema } = parsed.data;

  const resendApiKey = process.env.RESEND_API_KEY;
  const notifyEmail = process.env.LEAD_NOTIFY_EMAIL;

  if (resendApiKey && notifyEmail) {
    try {
      const resend = new Resend(resendApiKey);
      await resend.emails.send({
        from: 'DefensaYa <leads@defensaya.com>',
        to: notifyEmail,
        subject: `Nuevo lead: ${nombre}`,
        html: `
          <h2>Nuevo lead de DefensaYa</h2>
          <p><strong>Nombre:</strong> ${escapeHtml(nombre)}</p>
          <p><strong>Teléfono:</strong> ${escapeHtml(telefono)}</p>
          ${email ? `<p><strong>Email:</strong> ${escapeHtml(email)}</p>` : ''}
          <p><strong>Problema:</strong></p>
          <blockquote style="border-left:3px solid #10b981;padding-left:1rem;margin:0.5rem 0;">
            ${escapeHtml(problema)}
          </blockquote>
          <hr/>
          <p style="color:#6b7280;font-size:0.875rem;">IP: ${escapeHtml(ip)}</p>
        `,
      });
    } catch (err) {
      console.error('[/api/lead] Resend error:', err);
      // Don't fail the request if email sending fails
    }
  }

  return Response.json({ ok: true }, { status: 200 });
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}
