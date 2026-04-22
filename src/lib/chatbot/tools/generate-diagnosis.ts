import { tool } from 'ai';
import { z } from 'zod';
import { FieldsCollectedSchema } from '../schemas';

/**
 * Tool 3: generateDiagnosis
 * The LLM generates a complete legal diagnosis based on collected fields.
 * This tool should use gpt-4o (not mini) for higher quality legal reasoning.
 */
export const generateDiagnosisTool = tool({
  description:
    'Genera un diagnóstico legal preliminar completo del caso del consumidor. Incluye análisis de prescripción, prueba disponible, procedimiento sugerido y daños posibles. Este es el paso final del proceso de recopilación de datos.',
  inputSchema: z.object({
    collectedFields: FieldsCollectedSchema.describe('Todos los campos recopilados del caso'),
    conversationSummary: z
      .string()
      .describe('Resumen completo de la conversación para contexto adicional'),
  }),
});
