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
      'true SOLO si el usuario describe un hecho, problema o duda vinculada a consumo (compra, servicio, banco, garantía, etc.) aunque sea breve, u orientación seria. false si el texto es solo insulto, burla, spam, puro ruido, letras al azar, o charla que no aporta ningún dato o consulta (incl. respuestas inconducentes a un orientador de consumo).',
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
9. intakeApto: ver regla arriba. Si dudas entre true y false → false (no aprobar contenido dudoso o vacío de sentido de consumo).

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
