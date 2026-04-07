import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const TO_EMAIL = process.env.LEAD_NOTIFY_EMAIL || 'vadaladaniel82@gmail.com';

export async function POST(req: Request) {
  const data = await req.json();
  const { nombre, telefono, email, problema } = data;

  const { error } = await resend.emails.send({
    from: 'DefensaYa <onboarding@resend.dev>',
    to: TO_EMAIL,
    subject: `Nuevo lead DefensaYa: ${nombre}`,
    html: `
      <h2>Nuevo contacto desde DefensaYa</h2>
      <p><strong>Nombre:</strong> ${nombre}</p>
      <p><strong>Teléfono:</strong> ${telefono}</p>
      ${email ? `<p><strong>Email:</strong> ${email}</p>` : ''}
      <hr/>
      <p><strong>Problema:</strong></p>
      <p>${problema}</p>
    `,
  });

  if (error) {
    console.error('❌ Error enviando email:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }

  console.log('✅ Lead enviado a', TO_EMAIL);
  return Response.json({ success: true });
}
