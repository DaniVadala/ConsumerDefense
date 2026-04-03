export async function POST(req: Request) {
  const data = await req.json();
  // MVP: log + return success. En producción esto va a DB + notificación.
  console.log('🔔 NUEVO LEAD:', JSON.stringify(data, null, 2));
  // TODO: Enviar email de notificación con Resend
  return Response.json({ success: true });
}
