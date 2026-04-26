/**
 * Veto de salida: refuerza prohibiciones (disclaimer, números en texto) al final del system.
 */
const TZ = 'America/Argentina/Buenos_Aires';

/**
 * Texto fijo a anexar al system prompt: "hoy" anclado al reloj del servidor (consultas en AR).
 * Sin esto el modelo no puede saber en que ano calendario estamos.
 */
export function buildReferenceDateBlock(): string {
  const now = new Date();
  const inTz = (options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat('es-AR', { timeZone: TZ, ...options }).format(now);
  const year = inTz({ year: 'numeric' });
  const monthLong = inTz({ month: 'long' });
  const dayMonthYear = inTz({ day: 'numeric', month: 'long', year: 'numeric' });
  const timeShort = inTz({ hour: '2-digit', minute: '2-digit' });

  return [
    '----------------------------------------------------------------',
    '# CONTEXTO DE FECHA (el servidor inyecta esto en cada mensaje)',
    '----------------------------------------------------------------',
    `Trata la siguiente como la fecha/hora "de hoy" en Argentina. Usala para: interpretar "enero del 25" u otros meses; decidir si un hecho reportado en enero 2025 u otra fecha ya ocurrio; prescripcion; y no afirmar que un mes/ano claramente en el pasado "aun no ocurrio".`,
    '',
    `Zona horaria: ${TZ}.`,
    `Hoy es ${dayMonthYear} (${timeShort} hora local). Ano en curso: ${year} (${monthLong}).`,
    `Marca de tiempo ISO (referencia): ${now.toISOString()}.`,
  ].join('\n');
}

/**
 * Límites técnicos de salida. Toda la lógica de negocio vive en
 * `consumidor-chat-instructions.md` (cargada arriba en el system prompt).
 */
export function buildOutputVetoBlock(): string {
  return [
    '----------------------------------------------------------------',
    '# LIMITES TECNICOS (ademas de las instrucciones de consumidor)',
    '----------------------------------------------------------------',
    'El documento de instrucciones que precede define rol, flujo, items, cierres y diagnostico. Este bloque solo fija salida segura en la app.',
    '',
    '- NUNCA repitas términos/privacidad abiertos ni pidas aceptación (la app ya lo mostró).',
    '- NUNCA escribas nombres del estudio, telefonos, wa.me, ni [WHATSAPP] / placeholders; la UI tiene el boton.',
    '- Sin herramientas ni function calls: solo texto en el chat.',
  ].join('\n');
}

export async function buildSystemPromptWithInstructions(
  loadInstructions: () => Promise<string>,
): Promise<string> {
  const base = await loadInstructions();
  return [base, buildReferenceDateBlock(), buildOutputVetoBlock()].join('\n\n');
}
