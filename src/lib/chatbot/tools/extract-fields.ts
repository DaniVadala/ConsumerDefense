import { tool } from 'ai';
import { z } from 'zod';

/**
 * Tool 2: extractFields
 * The LLM extracts field values from a user message.
 * The LLM fills the inputSchema fields directly.
 */
export const extractFieldsTool = tool({
  description:
    'Extrae los valores concretos de los campos de información del caso del consumidor a partir del mensaje del usuario. Solo extrae campos que el usuario mencionó explícitamente. No inventes valores. Devuelve null para campos no mencionados O con valores claramente absurdos, imposibles o inválidos para un caso de consumo argentino.',
  inputSchema: z.object({
    description: z.string().nullable().describe('Descripción del problema de consumo. Devuelve null si es claramente una broma o absurdo sin relación con consumo real.'),
    company: z.string().nullable().describe('Nombre de la empresa involucrada. Devuelve null si el texto no parece un nombre real de empresa: si contiene lenguaje obsceno, es claramente ofensivo, o es una expresión que no corresponde a ninguna empresa real.'),
    incidentDate: z.string().nullable().describe('Fecha del incidente. Devuelve null si: (1) la fecha es anterior a 1993 (la Ley 24.240 entró en vigencia en octubre de 1993), (2) es claramente imposible o inventada (como "año 1900", "en 1920", "siglo XVIII"), (3) tiene más de 5 años de antigüedad —el plazo de prescripción de consumo es 3 años (Art. 50 Ley 24.240), por lo que fechas de antes de 2021 probablemente están prescriptas—, o (4) es una fecha futura que aún no ocurrió.'),
    incidentDateRange: z.string().nullable().describe('Rango de fechas del problema si fue un período. Misma validación: devuelve null si alguna fecha es anterior a 1993, tiene más de 5 años de antigüedad, o es claramente absurda.'),
    hasPriorClaim: z.boolean().nullable().describe('Si ya hizo un reclamo previo a la empresa'),
    priorClaimMedium: z.string().nullable().describe('Medio por el que hizo el reclamo previo (teléfono, email, carta, etc.)'),
    priorClaimDate: z.string().nullable().describe('Fecha en que realizó el reclamo previo. Devuelve null si es anterior a 1993 o claramente absurda.'),
    claimResponse: z.string().nullable().describe('Respuesta recibida de la empresa al reclamo'),
    claimResponseTime: z.string().nullable().describe('Cuánto tardaron en responder. Devuelve null si el tiempo es claramente imposible (ej: "20 años", "100 años", "en 1920", "desde el siglo XIX").'),
    hasDocumentation: z.boolean().nullable().describe('Si tiene documentación del caso'),
    documentationDetails: z.string().nullable().describe('Detalle de la documentación disponible. Devuelve null si la documentación mencionada es claramente absurda o no corresponde a documentación real de consumo (ej: "un papiro", "jeroglíficos", "inscripciones en piedra", "tablillas de arcilla").'),
    amount: z.string().nullable().describe('Monto involucrado en el caso. Devuelve null si está expresado en una moneda claramente inaplicable al consumo argentino (ej: yuanes chinos, coronas noruegas, marcos alemanes, ducados, doblones). Pesos argentinos (ARS o $), dólares (USD) y euros (EUR) son aceptables.'),
    additionalExpenses: z.string().nullable().describe('Gastos adicionales generados como consecuencia del problema'),
  }),
});
