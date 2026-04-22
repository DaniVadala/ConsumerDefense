export function buildIntakePrompt(params: {
  pendingFields: string[];
  collectedFieldsCompact: string;
  conversationSummary: string;
}): string {
  const { pendingFields, collectedFieldsCompact, conversationSummary } = params;

  const now = new Date();
  const todayStr = now.toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });
  const currentYear = now.getFullYear();
  const prescriptionCutoffYear = currentYear - 3; // Art. 50 Ley 24.240

  const FIELD_QUESTIONS: Record<string, string> = {
    description: 'Contame brevemente qué pasó con el producto o servicio que adquiriste.',
    company: '¿Con qué empresa o comercio tuviste el problema?',
    date: '¿Cuándo ocurrió esto? Si fue durante un período, indicame las fechas aproximadas.',
    prior_claim: '¿Ya hiciste algún reclamo a la empresa? Si sí, ¿por qué medio (teléfono, email, carta documento, redes sociales, libro de quejas) y en qué fecha?',
    claim_response: '¿Qué te respondieron? ¿Cuánto tiempo tardaron en responder?',
    documentation: '¿Contás con documentación del caso? Por ejemplo: facturas, tickets, fotos, capturas, emails, números de reclamo. Contame qué tenés.',
    amount: '¿Cuál fue el monto involucrado? ¿Tuviste gastos adicionales como consecuencia del problema?',
  };

  const questionsSection = pendingFields
    .map((f) => FIELD_QUESTIONS[f] ?? f)
    .join('\n');

  return `Fecha de hoy: ${todayStr}. Año actual: ${currentYear}.

Estás en la fase de recopilación de datos.

Campos pendientes de obtener:
${pendingFields.join(', ')}

Campos ya obtenidos:
${collectedFieldsCompact || '(ninguno aún)'}

Resumen de la conversación hasta ahora:
${conversationSummary || '(conversación inicial)'}

Haz la SIGUIENTE pregunta del flujo (solo una a la vez). Si el usuario ya proporcionó información sobre múltiples campos, reconócelo y avanza al siguiente campo pendiente.

PREGUNTAS GUÍA POR CAMPO:
${questionsSection}

VALIDACIÓN CRÍTICA DE DATOS:
Si el usuario proporciona información claramente imposible, absurda o inválida para un caso de consumo argentino, NO la des por válida. Mencioná específicamente qué dato parece inválido y por qué, y volvé a hacer la pregunta. Casos que debés detectar y rechazar:
- Fechas anteriores a 1993 o claramente inventadas (ej: "año 1900", "en 1920", "siglo XVIII") → la Ley 24.240 fue sancionada en octubre de 1993
- Fechas con más de 5 años de antigüedad (ej: antes de ${currentYear - 5}, como "en 1994", "en 2018", "hace 8 años") → el plazo de prescripción de los reclamos de consumo en Argentina es de 3 años (Art. 50 Ley 24.240, prescripción a partir de ${prescriptionCutoffYear}). Informale al usuario con empatía que su reclamo podría estar prescripto, explicá brevemente qué significa eso (que el plazo legal para accionar venció), y sugerile consultar con un especialista a través de WhatsApp si quiere verificar si aún hay alguna acción posible. NO sigas recopilando información si el caso claramente está prescripto.
- Tiempos de espera ridículos (ej: "hace más de 10 años esperando respuesta", "desde hace 20 años") → igualmente reflejan un caso prescripto; aplicá la misma advertencia que para fechas viejas
- Monedas inaplicables al consumo argentino (ej: "yuanes", "coronas noruegas", "marcos alemanes", "doblones") → pedí el monto en pesos argentinos, dólares o euros
- Nombres de empresa que contienen lenguaje obsceno o claramente ofensivo, o que no corresponden a ninguna empresa real → pedí el nombre real de la empresa o comercio involucrado con empatía
- Medios de reclamo claramente inválidos (ej: "pintando con aerosol", "con un graffiti", "escribiéndolo en la pared") → aclará que necesitás saber por qué canal de comunicación real fue el reclamo (teléfono, email, carta, redes sociales, etc.)
- Documentación claramente no-documentaria (ej: "un papiro", "jeroglíficos", "tablillas de arcilla") → aclará que necesitás documentación real: facturas, emails, capturas, tickets, resúmenes de cuenta, etc.
- Tiempos de respuesta claramente imposibles (ej: "en 1920", "tardaron 80 años") → señalarlo y pedir el dato correcto`;
}
