import { z } from 'zod';
import { tool } from 'ai';

// ── Constantes exportadas (usadas por diagnostic-card) ──────────────────────

export const AREAS_RECLAMO = [
  'telecomunicaciones',
  'financiero',
  'electrodomesticos',
  'ecommerce',
  'seguros_prepaga',
  'servicios_publicos',
  'turismo_aereo',
] as const;

export const LEGISLACION_AUTORIZADA = [
  'Ley 24.240 - Defensa del Consumidor',
  'Ley 26.361 - Modificatoria LDC',
  'Ley 26.993 - COPREC',
  'Ley 25.065 - Tarjetas de Crédito',
  'CCyCN Arts. 1092-1122',
  'Ley 26.682 - Medicina Prepaga',
  'Ley 17.418 - Seguros',
  'Resolución ENACOM (general)',
  'Marco regulatorio ENRE',
  'Marco regulatorio ENARGAS',
  'Resolución SCI 1033/2021 - VUF',
  'Código Aeronáutico',
  'Ley 24.240 Art. 34 - Revocación',
  'Ley 24.240 Arts. 11-18 - Garantías',
] as const;

export const RANGOS_MONTO = [
  'No especificado',
  'Menos de $50.000',
  '$50.000 - $200.000',
  '$200.000 - $1.000.000',
  'Más de $1.000.000',
] as const;

export const FORTALEZA_DOCUMENTAL = [
  'Documentación sólida',
  'Documentación parcial',
  'Documentación pendiente de reunir',
] as const;

export const URLS_OFICIALES: Record<string, string> = {
  'Ventanilla Única Federal': 'https://www.argentina.gob.ar/servicio/iniciar-un-reclamo-ante-defensa-del-consumidor',
  'COPREC': 'https://www.argentina.gob.ar/justicia/derechofacil/leysimple/coprec',
  'ENACOM': 'https://www.enacom.gob.ar/reclamos',
  'ENRE': 'https://www.enre.gov.ar/web/web.nsf/Reclamos',
  'ENARGAS': 'https://www.enargas.gob.ar/secciones/consumidores/reclamos.php',
  'SSS': 'https://www.argentina.gob.ar/sssalud',
  'BCRA': 'https://www.bcra.gob.ar/BCRAyVos/Usuarios_Financieros.asp',
};

export const DISCLAIMER_FIJO =
  'Esta orientación es automatizada y no constituye asesoramiento legal profesional. Consultá con un abogado matriculado antes de actuar.' as const;

// ── Schemas ──────────────────────────────────────────────────────────────────

const generarDiagnosticoSchema = z.object({
  caso_id: z.string().describe('ID del caso. Formato: RB-YYYY-XXXX'),
  area: z.enum(AREAS_RECLAMO),
  proveedor: z.string().default('No especificado'),
  problema_principal: z.string().max(150),
  tiempo_del_problema: z.string().default('No especificado'),
  reclamo_previo: z.object({
    realizado: z.boolean(),
    con_numero_gestion: z.boolean().default(false),
    numero_gestion: z.string().optional(),
  }),
  documentacion_disponible: z.array(z.string()).default([]),
  monto_declarado: z.enum(RANGOS_MONTO).default('No especificado'),
  legislacion_aplicable: z.array(z.enum(LEGISLACION_AUTORIZADA)).min(1).max(4),
  fortaleza_documental: z.enum(FORTALEZA_DOCUMENTAL),
  documentacion_sugerida: z.array(z.string()).max(3).default([]),
  escenarios_resolucion: z
    .array(z.object({ via: z.string(), descripcion: z.string().max(120) }))
    .length(3),
  disclaimer: z.literal(DISCLAIMER_FIJO),
});

const mostrarWhatsAppCTASchema = z.object({
  caso_id: z.string(),
  area: z.string(),
  proveedor: z.string(),
  resumen: z.string().max(120),
});

// ── Tools ────────────────────────────────────────────────────────────────────

export const chatTools = {
  generarDiagnostico: tool({
    description:
      'Genera el diagnóstico del caso. Llamar cuando tengas: empresa + problema + si reclamó antes. Siempre llamar inmediatamente después mostrarWhatsAppCTA.',
    inputSchema: generarDiagnosticoSchema,
    execute: async () => 'Diagnóstico generado.',
  }),
  mostrarWhatsAppCTA: tool({
    description:
      'Muestra botón de WhatsApp para contactar al abogado. Llamar SIEMPRE inmediatamente después de generarDiagnostico.',
    inputSchema: mostrarWhatsAppCTASchema,
    execute: async () => 'CTA mostrado.',
  }),
};

// ── Tipos exportados ─────────────────────────────────────────────────────────

export type GenerarDiagnosticoArgs = z.infer<typeof generarDiagnosticoSchema>;
export type MostrarWhatsAppCTAArgs = z.infer<typeof mostrarWhatsAppCTASchema>;
