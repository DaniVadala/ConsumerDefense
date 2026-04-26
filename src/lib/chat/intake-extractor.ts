/**
 * Extrae los campos del caso a partir del texto libre del usuario.
 * Usa generateObject con schema Zod estricto y temperature=0.
 * Devuelve null para los campos que no están en el texto.
 */
import { generateObject } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { z } from 'zod';

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const StepExtractionSchema = z.object({
  step1: z.string().nullable().describe('Descripcion del hecho o reclamo. null si no se menciona.'),
  step2: z.string().nullable().describe('Nombre de la empresa o proveedor involucrado. null si no se menciona.'),
  step3: z.string().nullable().describe('Fecha o periodo en que ocurrio (mes, año, "hace dos meses", etc.). null si no se menciona.'),
  step4: z
    .enum(['si', 'no', 'no_recuerda'])
    .nullable()
    .describe(
      'Si hubo reclamo previo. si=reclamo confirmado, no=sin reclamo, no_recuerda=no sabe. null si no se menciona.',
    ),
  step5: z
    .string()
    .nullable()
    .describe('Medios por los que reclamo (mail, telefono, OMIC, etc.). null si step4 no es "si" o no se menciona.'),
  step6: z
    .string()
    .nullable()
    .describe('Respuesta de la empresa al reclamo. null si step4 no es "si" o no se menciona.'),
  step7: z.string().nullable().describe('Provincia argentina donde se haria el reclamo. null si no se menciona.'),
  step8: z.string().nullable().describe('Monto del daño o reclamo (cifra, rango, o "no se"). null si no se menciona.'),
  step9: z
    .string()
    .nullable()
    .describe(
      'Qué pruebas o documentación menciona: factura, mails, contrato, fotos, testigos, denuncia, etc. null si no se menciona.',
    ),
});

/** Solo campos del caso (sin bandera de aptitud). */
export const ExtractionSchema = StepExtractionSchema;

export type ExtractedAnswers = z.infer<typeof StepExtractionSchema>;

const ExtractorObjectSchema = StepExtractionSchema.extend({
  intakeApto: z
    .boolean()
    .describe(
      'true SOLO si el relato encuadra en defensa del consumidor argentina: el usuario como consumidor o usuario de servicios frente a un proveedor de bienes/servicios (comercio, e-commerce, banco o entidad financiera en esa posición, aerolínea, telefonía/internet, servicios contratados, garantías, cargos indebidos en tarjeta/cuenta, etc.). false si el tema es AJENO a esa relación de consumo: accidente de tránsito o choque y fuga sin reclamo contra un proveedor/consumo; daños entre particulares sin vínculo de consumo; solo conflicto civil entre personas; laboral exclusivo; penal; familia; alquiler entre particulares sin intermediario de consumo; consultas que no son de consumo; o texto insultante/spam/sin sustancia. Ante duda → false.',
    ),
});

// ---------------------------------------------------------------------------
// System prompt del extractor
// ---------------------------------------------------------------------------

const EXTRACTOR_SYSTEM = `Sos un extractor de datos estructurados. Analizas el texto de un usuario
que describe un problema de defensa del consumidor y extraes los datos que
aparecen explicitamente en el texto.

REGLAS CRITICAS:
1. Solo extraes lo que esta EXPLICITO en el texto. No inferis, no completas,
   no adivinas.
2. Si un dato no esta en el texto → devolver null para ese campo.
3. step5 (medios de reclamo) solo puede tener valor si step4 es "si".
4. step6 (respuesta empresa) solo puede tener valor si step4 es "si".
5. Para step4: "no me respondieron" o "no responden" NO significa que no
   hizo reclamo — significa que SI reclamo pero no obtuvo respuesta.
   En ese caso step4="si" y step6="no respondio".
6. Para step7: reconocer variantes ("cordoba", "caba", "buenos aires",
   "gba", "bsas", etc.) y normalizar al nombre oficial.
7. Para step8: extraer la cifra o rango tal como aparece. Si dice
   "no se el monto" → "No sabe el monto exacto".
8. step9: tipos de prueba que el usuario dice tener (tengo factura, guarde los mails, etc.),
   o null si no menciona nada. Resumir en una frase corta o lista separada por comas.
9. intakeApto: ver regla arriba. Si dudas entre true y false → false.

EJEMPLOS:

Texto: "Me cancelaron un vuelo en abril del 2025. Reclame por mail en mayo
pero no me responden. Quiero reclamar en Cordoba por 1 millon de pesos."
→ intakeApto: true
→ step1: "Cancelacion de vuelo"
→ step2: null (no menciono empresa)
→ step3: "Abril 2025"
→ step4: "si"
→ step5: "Mail"
→ step6: "No respondieron"
→ step7: "Córdoba"
→ step8: "ARS 1.000.000"
→ step9: null

Texto: "Banco Galicia me cobro un cargo que no corresponde"
→ intakeApto: true
→ step1: "Cobro de cargo indebido"
→ step2: "Banco Galicia"
→ step3: null
→ step4: null
→ step5: null
→ step6: null
→ step7: null
→ step8: null
→ step9: null

Texto: "asdfasdf jaja" o "sos un inutil trol" o solo emojis/insultos
→ intakeApto: false, el resto null donde corresponda

Texto: "Hace dos semanas choque y fuga, daños al auto, tengo patente del otro, la reparación sale 350 mil, no hay empresa del reclamo"
→ intakeApto: false (no hay relación de consumo con un proveedor; es materia civil/seguros fuera de este canal)
→ extraer igual los campos que figuren en el texto si sirven para contexto, o null

Texto: "La aseguradora me rechazó el siniestro del auto y no me dan bolilla, contrato con Zurich"
→ intakeApto: true (reclamo frente a prestadora/seguro en posición de consumidor)

Devuelve SOLO el JSON valido segun el schema. Sin texto adicional.`;

// ---------------------------------------------------------------------------
// Funcion principal
// ---------------------------------------------------------------------------

function extractModelId(): string {
  return process.env.OPENAI_EXTRACT_MODEL ?? process.env.OPENAI_MODEL ?? 'gpt-4.1-mini';
}

export async function extractFromFreeText(text: string): Promise<{
  extracted: ExtractedAnswers;
  intakeApto: boolean;
}> {
  const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const { object } = await generateObject({
    model: openai(extractModelId()),
    schema: ExtractorObjectSchema,
    system: EXTRACTOR_SYSTEM,
    prompt: `Extraer datos del siguiente texto:\n\n"${text}"`,
    temperature: 0,
  });

  const { intakeApto, ...extracted } = object;
  return { extracted, intakeApto };
}

// ---------------------------------------------------------------------------
// Segundo mensaje del intake: merge con CONTEXTO del caso (no revalidar relato entero)
// ---------------------------------------------------------------------------

const FollowupMergeObjectSchema = StepExtractionSchema.extend({
  conducente: z
    .boolean()
    .describe(
      'true si el mensaje aporta o corrige datos útiles del MISMO reclamo de consumo ya en curso (incluso una frase corta: fechas, empresa, monto, si reclamó, provincia, pruebas, etc.). false solo ante spam, insultos, tema claramente ajeno al caso, charla sin hechos, o pedidos fuera de defensa del consumidor.',
    ),
});

const FOLLOWUP_MERGE_SYSTEM = `Sos el extractor del mismo formulario de defensa del consumidor (Argentina), en modo ACLARACIÓN.

Ya tenés datos extraídos del relato inicial. El usuario envía un MENSAJE NUEVO, a menudo corto, para completar o corregir el caso.

REGLAS:
1) conducente: true si el mensaje sirve para este reclamo (datos nuevos o correcciones), aunque sea muy breve ("fue en abril 2025", "la empresa es Frávega", "todavía no reclamé", "fueron 80 mil pesos"). false solo si es ruido, insulto, tema no relacionado, o no aporta nada al caso.
2) NO uses el criterio de "relato completo" del primer paso: acá los fragmentos válidos cuentan.
3) Para step1..step9: devolvé valor SOLO si el mensaje nuevo lo menciona o corrige EXPLÍCITAMENTE. Si no aplica → null (al fusionar se conserva lo anterior).
4) Mismas reglas que el extractor principal: step5/step6 solo si step4 sería "si"; si el mensaje solo aclara fecha y nada más, solo step3 lleva texto.
5) Fechas relativas o parciales ("abril 2025", "hace dos meses") → step3 con el texto normalizado claro.
6) No inventes datos que el usuario no dijo.

Ejemplo: datos actuales con step3 null. Mensaje: "esto ocurrió en abril del 2025" → conducente true, step3 "Abril 2025", resto null.
Ejemplo: mensaje "hola" → conducente false, todo null.
Ejemplo: mensaje sobre política o trabajo sin vínculo con el caso → conducente false.`;

function normalizeAfterStep4(answers: ExtractedAnswers): ExtractedAnswers {
  if (answers.step4 !== 'si') {
    return { ...answers, step5: null, step6: null };
  }
  return answers;
}

function applyExtractionDelta(current: ExtractedAnswers, delta: ExtractedAnswers): ExtractedAnswers {
  const keys: (keyof ExtractedAnswers)[] = [
    'step1',
    'step2',
    'step3',
    'step4',
    'step5',
    'step6',
    'step7',
    'step8',
    'step9',
  ];
  const merged: ExtractedAnswers = { ...current };
  for (const k of keys) {
    const v = delta[k];
    if (v !== null && v !== undefined) {
      (merged as Record<keyof ExtractedAnswers, string | null>)[k] = v as string | null;
    }
  }
  return normalizeAfterStep4(merged);
}

function answersEqual(a: ExtractedAnswers, b: ExtractedAnswers): boolean {
  return (
    a.step1 === b.step1 &&
    a.step2 === b.step2 &&
    a.step3 === b.step3 &&
    a.step4 === b.step4 &&
    a.step5 === b.step5 &&
    a.step6 === b.step6 &&
    a.step7 === b.step7 &&
    a.step8 === b.step8 &&
    a.step9 === b.step9
  );
}

export type FollowupMergeResult =
  | { ok: true; merged: ExtractedAnswers }
  | { ok: false; reason: 'not_apto' | 'no_delta' };

/**
 * Fusiona un mensaje de aclaración viendo el caso ya extraído. No reutiliza intakeApto sobre el texto aislado
 * (los fragmentos cortos fallarían); usa conducente contextual.
 */
export async function mergeFollowupIntoAnswers(
  current: ExtractedAnswers,
  followupText: string,
): Promise<FollowupMergeResult> {
  const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const snapshot = `1. Descripción: ${current.step1 ?? 'null'}
2. Empresa: ${current.step2 ?? 'null'}
3. Fecha: ${current.step3 ?? 'null'}
4. Reclamo previo: ${current.step4 ?? 'null'}
5. Medios: ${current.step5 ?? 'null'}
6. Respuesta empresa: ${current.step6 ?? 'null'}
7. Provincia: ${current.step7 ?? 'null'}
8. Monto: ${current.step8 ?? 'null'}
9. Pruebas: ${current.step9 ?? 'null'}`;

  const { object } = await generateObject({
    model: openai(extractModelId()),
    schema: FollowupMergeObjectSchema,
    system: FOLLOWUP_MERGE_SYSTEM,
    prompt: `Datos actuales del caso:\n${snapshot}\n\nMensaje nuevo del usuario:\n"${followupText}"`,
    temperature: 0,
  });

  const { conducente, ...delta } = object;
  if (!conducente) {
    return { ok: false, reason: 'not_apto' };
  }
  const merged = applyExtractionDelta(current, delta);
  if (answersEqual(merged, current)) {
    return { ok: false, reason: 'no_delta' };
  }
  return { ok: true, merged };
}

// ---------------------------------------------------------------------------
// Helper: calcular steps faltantes
// ---------------------------------------------------------------------------

export type StepKey = 'step1' | 'step2' | 'step3' | 'step4' | 'step5' | 'step6' | 'step7' | 'step8' | 'step9';

export function getPendingSteps(answers: ExtractedAnswers): StepKey[] {
  const allSteps: StepKey[] = ['step1', 'step2', 'step3', 'step4', 'step5', 'step6', 'step7', 'step8', 'step9'];

  return allSteps.filter((key) => {
    if ((key === 'step5' || key === 'step6') && answers.step4 !== 'si') {
      return false;
    }
    return answers[key] === null;
  });
}

// ---------------------------------------------------------------------------
// Helper: mergear extraido con formulario
// Los datos del formulario tienen prioridad (el usuario puede corregir)
// ---------------------------------------------------------------------------

export function mergeAnswers(
  extracted: ExtractedAnswers,
  formAnswers: Partial<ExtractedAnswers>,
): ExtractedAnswers {
  return {
    step1: formAnswers.step1 ?? extracted.step1,
    step2: formAnswers.step2 ?? extracted.step2,
    step3: formAnswers.step3 ?? extracted.step3,
    step4: formAnswers.step4 ?? extracted.step4,
    step5: formAnswers.step5 ?? extracted.step5,
    step6: formAnswers.step6 ?? extracted.step6,
    step7: formAnswers.step7 ?? extracted.step7,
    step8: formAnswers.step8 ?? extracted.step8,
    step9: formAnswers.step9 ?? extracted.step9,
  };
}

// ---------------------------------------------------------------------------
// Helper: armar el mensaje para el LLM de diagnostico
// ---------------------------------------------------------------------------

export function buildDiagnosisPrompt(answers: ExtractedAnswers): string {
  const step4Label =
    answers.step4 === 'si'
      ? 'Sí'
      : answers.step4 === 'no'
        ? 'No'
        : answers.step4 === 'no_recuerda'
          ? 'No recuerda'
          : 'No informado';

  return `Datos del caso recolectados:

1. Descripción del hecho: ${answers.step1 ?? 'No informado'}
2. Empresa o proveedor: ${answers.step2 ?? 'No informado'}
3. Fecha o período: ${answers.step3 ?? 'No informado'}
4. Reclamo previo: ${step4Label}
5. Medios del reclamo: ${answers.step5 ?? 'No aplica'}
6. Respuesta de la empresa: ${answers.step6 ?? 'No aplica'}
7. Provincia: ${answers.step7 ?? 'No informado'}
8. Monto: ${answers.step8 ?? 'No informado'}
9. Pruebas o documentación disponible: ${answers.step9 ?? 'No informado'}

Emitir el diagnóstico completo según el formato del system prompt.`;
}

// ---------------------------------------------------------------------------
// Mensaje prefijado para WhatsApp (post-diagnóstico)
// ---------------------------------------------------------------------------

export const WHATSAPP_HANDOFF_MAX_CHARS = 1700;

function formatStep4ForWhatsApp(step4: ExtractedAnswers['step4']): string {
  if (step4 === 'si') return 'Sí';
  if (step4 === 'no') return 'No';
  if (step4 === 'no_recuerda') return 'No recuerda';
  return '';
}

/**
 * Relato y datos estructurados, sin saludo ni pie (para combinar con otros textos).
 */
export function buildWhatsAppCaseFactsBlock(answers: ExtractedAnswers): string {
  const narrative = answers.step1?.trim();
  const head: string[] = [];
  if (narrative) {
    head.push(`"${narrative}"`, '');
  }
  const detail: string[] = [];
  if (answers.step2?.trim()) detail.push(`Empresa o proveedor: ${answers.step2.trim()}`);
  if (answers.step3?.trim()) detail.push(`Fecha o período: ${answers.step3.trim()}`);
  const s4 = formatStep4ForWhatsApp(answers.step4);
  if (s4) detail.push(`Reclamo previo a la empresa: ${s4}`);
  if (answers.step4 === 'si' && answers.step5?.trim()) detail.push(`Medios del reclamo: ${answers.step5.trim()}`);
  if (answers.step4 === 'si' && answers.step6?.trim()) detail.push(`Respuesta de la empresa: ${answers.step6.trim()}`);
  if (answers.step7?.trim()) detail.push(`Provincia: ${answers.step7.trim()}`);
  if (answers.step8?.trim()) detail.push(`Monto: ${answers.step8.trim()}`);
  if (answers.step9?.trim()) detail.push(`Pruebas o documentación: ${answers.step9.trim()}`);

  const body = [...head, detail.join('\n')].join('\n').trimEnd();
  if (!body) return '(Sin datos cargados en el chat.)';
  return body;
}

/**
 * Mensaje completo para wa.me tras el análisis: situación + datos + pie.
 */
export function buildWhatsAppHandoffMessage(answers: ExtractedAnswers): string {
  const intro = 'Hola DefensaYa. Necesito asesoramiento con esta situación:\n\n';
  const body = buildWhatsAppCaseFactsBlock(answers);
  const footer = '\n\n— Ya completé el análisis preliminar en DefensaYa.';
  let full = intro + body + footer;
  if (full.length > WHATSAPP_HANDOFF_MAX_CHARS) {
    full = full.slice(0, WHATSAPP_HANDOFF_MAX_CHARS - 1) + '…';
  }
  return full;
}
