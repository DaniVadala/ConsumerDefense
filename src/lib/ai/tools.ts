import { z } from 'zod';
import { tool } from 'ai';

export const askIntakeQuestionSchema = z.object({
  pregunta: z.string().describe('La pregunta a mostrar al usuario'),
  opciones: z.array(z.string()).min(2).max(6).describe('Opciones de respuesta como botones.'),
  paso_actual: z.number().min(1).max(5).describe('Número de paso actual en el intake (1-5)'),
  paso_total: z.number().min(3).max(5).describe('Total de pasos del intake'),
  area_identificada: z.string().optional().describe('Área de reclamo si ya se determinó'),
});

export const generarDiagnosticoSchema = z.object({
  caso_id: z.string().describe('ID del caso formato RB-YYYY-XXXX'),
  area: z.enum([
    'telecomunicaciones',
    'financiero',
    'electrodomesticos',
    'ecommerce',
    'seguros_prepaga',
    'servicios_publicos',
    'turismo_aereo',
  ]).describe('Área del reclamo identificada'),
  proveedor: z.string().describe('Nombre de la empresa proveedora'),
  problema_principal: z.string().describe('Resumen del problema en una oración'),
  tiempo_del_problema: z.string().describe('Hace cuánto tiene el problema'),
  reclamo_previo: z.object({
    realizado: z.boolean(),
    con_numero_gestion: z.boolean(),
    numero_gestion: z.string().optional(),
  }),
  documentacion_disponible: z.array(z.string()).describe('Lista de documentos que tiene el usuario'),
  monto_declarado: z.string().describe('Rango de monto autodeclarado por el usuario. NO calcular daño.'),
  legislacion_aplicable: z.array(z.string()).describe('Leyes y resoluciones aplicables. Solo citar, NO interpretar.'),
  escenarios_resolucion: z.array(z.object({
    via: z.string(),
    descripcion: z.string(),
    url: z.string().optional().describe('URL oficial del recurso si existe'),
  })).describe('Vías generales de resolución como información pública. NO recomendar cuál elegir.'),
  lead_score: z.number().min(0).max(12).describe('Score interno 0-12. reclamo_previo(0-3)+documentacion(0-3)+monto(0-3)+datos_completos(0-3). No mostrar al usuario.'),
});

export const mostrarWhatsAppCTASchema = z.object({
  caso_id: z.string().describe('El caso_id que se generó en el diagnóstico'),
  area: z.string().describe('Área del reclamo, ej: telecomunicaciones'),
  proveedor: z.string().describe('Nombre de la empresa proveedora'),
  resumen: z.string().max(100).describe('Resumen del problema en una línea corta'),
});

export const mostrarSelectorAreaSchema = z.object({
  mensaje: z.string().describe('Texto introductorio antes del selector. Las áreas se muestran automáticamente.'),
});

export type AskIntakeQuestionArgs = z.infer<typeof askIntakeQuestionSchema>;
export type GenerarDiagnosticoArgs = z.infer<typeof generarDiagnosticoSchema>;
export type MostrarWhatsAppCTAArgs = z.infer<typeof mostrarWhatsAppCTASchema>;
export type MostrarSelectorAreaArgs = z.infer<typeof mostrarSelectorAreaSchema>;

export const askIntakeQuestion = tool({
  description: 'Pregunta de intake con opciones como botones. UNA por turno.',
  inputSchema: askIntakeQuestionSchema,
  execute: async () => 'Pregunta mostrada.',
});

export const generarDiagnostico = tool({
  description: 'Diagnóstico del caso. Llamar cuando se tengan: problema + cuándo + monto + reclamo previo.',
  inputSchema: generarDiagnosticoSchema,
  execute: async () => 'Diagnóstico mostrado.',
});

export const mostrarWhatsAppCTA = tool({
  description: 'Botón WhatsApp post-diagnóstico. Llamar INMEDIATAMENTE después de generarDiagnostico.',
  inputSchema: mostrarWhatsAppCTASchema,
  execute: async () => 'Botón mostrado.',
});

export const mostrarSelectorArea = tool({
  description: 'Muestra selector de áreas. Solo enviar mensaje, las áreas son fijas en el frontend.',
  inputSchema: mostrarSelectorAreaSchema,
  execute: async () => 'Selector mostrado.',
});

export const reclamobotTools = {
  askIntakeQuestion,
  generarDiagnostico,
  mostrarWhatsAppCTA,
  mostrarSelectorArea,
};
