import { NextResponse } from 'next/server';
import { z } from 'zod';

const LawyerSchema = z.object({
  name: z.string().min(2).max(100),
  registration: z.string().min(3).max(100),
  email: z.string().email(),
  phone: z.string().min(6).max(30),
  specialties: z.array(z.string()).min(1),
  jurisdiction: z.string().min(2).max(100),
  yearsOfPractice: z.number().int().min(0).max(60).optional(),
  cvUrl: z.string().url().optional().or(z.literal('')),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = LawyerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Datos inválidos', details: parsed.error.issues }, { status: 400 });
    }

    const data = parsed.data;
    const notifyEmail = process.env.LEAD_NOTIFY_EMAIL;
    const resendKey = process.env.RESEND_API_KEY;

    if (notifyEmail && resendKey) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${resendKey}`,
        },
        body: JSON.stringify({
          from: 'DefensaYa <noreply@defensaya.com>',
          to: [notifyEmail],
          subject: `[DefensaYa] Nueva inscripción de abogado/a: ${data.name}`,
          html: `
            <h2>Nueva solicitud de incorporación a la red de abogados</h2>
            <table cellpadding="6" cellspacing="0" style="border-collapse:collapse">
              <tr><td><strong>Nombre</strong></td><td>${data.name}</td></tr>
              <tr><td><strong>Matrícula</strong></td><td>${data.registration}</td></tr>
              <tr><td><strong>Email</strong></td><td>${data.email}</td></tr>
              <tr><td><strong>Teléfono</strong></td><td>${data.phone}</td></tr>
              <tr><td><strong>Especialidades</strong></td><td>${data.specialties.join(', ')}</td></tr>
              <tr><td><strong>Jurisdicción</strong></td><td>${data.jurisdiction}</td></tr>
              ${data.yearsOfPractice !== undefined ? `<tr><td><strong>Años de ejercicio</strong></td><td>${data.yearsOfPractice}</td></tr>` : ''}
              ${data.cvUrl ? `<tr><td><strong>CV</strong></td><td><a href="${data.cvUrl}">${data.cvUrl}</a></td></tr>` : ''}
            </table>
          `,
        }),
      });
    }

    return NextResponse.json({ ok: true, message: 'Inscripción registrada correctamente' });
  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
