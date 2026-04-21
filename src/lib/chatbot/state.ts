// src/lib/chatbot/state.ts
import { Annotation } from '@langchain/langgraph';

export type ChatMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

export type UIComponent =
  | { type: 'areaSelector'; areas: Array<{ key: string; label: string }> }
  | {
      type: 'intakeQuestion';
      pregunta: string;
      placeholder?: string;
      opciones: string[];
      tipoInput: 'seleccion' | 'texto_libre' | 'si_no' | 'checklist';
      pasoActual: number;
      pasoTotal: number;
    }
  | { type: 'diagnostico'; data: DiagnosticoData }
  | {
      type: 'whatsappCTA';
      casoId: string;
      area: string;
      proveedor: string;
      resumen: string;
    }
  | { type: 'urgencia'; motivo: string; recurso: string; contacto?: string }
  | { type: 'fallbackWhatsApp'; contexto: string };

export const AREAS = {
  telecomunicaciones: 'Telecomunicaciones',
  financiero: 'Bancos y tarjetas',
  electrodomesticos: 'Electrodomésticos y garantía',
  ecommerce: 'Compras online',
  seguros_prepaga: 'Seguros o prepaga',
  servicios_publicos: 'Servicios públicos',
  turismo_aereo: 'Turismo y vuelos',
  otros_consumo: 'Otros temas de consumo',
} as const;

export type AreaKey = keyof typeof AREAS;

export const LEGISLACION_POR_AREA: Record<AreaKey, string[]> = {
  telecomunicaciones: [
    'Ley 24.240 - Defensa del Consumidor',
    'Ley 27.078 - Argentina Digital',
    'Resoluciones ENACOM aplicables',
    'Ley Pcial. Córdoba 10.247 - procedimiento local',
  ],
  financiero: [
    'Ley 24.240 - Defensa del Consumidor',
    'Ley 25.065 - Tarjetas de Crédito',
    'Comunicaciones BCRA sobre protección al usuario financiero',
    'Ley Pcial. Córdoba 10.247',
  ],
  electrodomesticos: [
    'Ley 24.240 - Garantía legal (arts. 11-18)',
    'CCyCN arts. 1092-1122 - Relación de consumo',
    'Ley 27.442 - Lealtad Comercial',
    'Ley Pcial. Córdoba 10.247',
  ],
  ecommerce: [
    'Ley 24.240 - Defensa del Consumidor',
    'Ley 24.240 art. 34 - Revocación en compras a distancia',
    'CCyCN arts. 1092-1122',
    'Ley 27.442 - Lealtad Comercial',
    'Ley Pcial. Córdoba 10.247',
  ],
  seguros_prepaga: [
    'Ley 24.240 - Defensa del Consumidor',
    'Ley 26.682 - Medicina Prepaga',
    'Ley 17.418 - Seguros',
    'Normativa Superintendencia de Servicios de Salud',
    'Ley Pcial. Córdoba 10.247',
  ],
  servicios_publicos: [
    'Ley 24.240 - Defensa del Consumidor',
    'Marco regulatorio ENRE / ENARGAS',
    'Normativa ERSeP Córdoba para servicios provinciales',
    'Ley Pcial. Córdoba 10.247',
  ],
  turismo_aereo: [
    'Ley 24.240 - Defensa del Consumidor',
    'Código Aeronáutico',
    'Resolución 1532/98 - Condiciones generales transporte aéreo',
    'Ley Pcial. Córdoba 10.247',
  ],
  otros_consumo: [
    'Ley 24.240 - Defensa del Consumidor',
    'CCyCN arts. 1092-1122',
    'Ley 27.442 - Lealtad Comercial',
    'Ley Pcial. Córdoba 10.247',
  ],
};

export const DISCLAIMER =
  'Esta orientación es automatizada y no constituye asesoramiento legal profesional. Consultá con un abogado matriculado antes de actuar.';

export function getDisclaimer(locale: string): string {
  return locale === 'en'
    ? 'This guidance is automated and does not constitute professional legal advice. Consult a licensed attorney before taking any action.'
    : DISCLAIMER;
}

export interface IntakeCaptured {
  area?: AreaKey;
  areaConfirmada: boolean;
  proveedor?: string;
  problemaPrincipal?: string;
  problemaTextoLibre?: string;
  tiempo?: string;
  monto?: string;
  reclamoPrevio?: {
    realizado: boolean;
    conNumero: boolean;
    numero?: string;
  };
  detalleReclamo?: string;
  documentacion?: string[];
}

export interface DiagnosticoData {
  casoId: string;
  area: string;
  proveedor: string;
  problemaPrincipal: string;
  tiempo: string;
  monto?: string;
  reclamoPrevio: { realizado: boolean; conNumero: boolean };
  detalleReclamo?: string;
  legislacionAplicable: string[];
  fortalezaDocumental?: string;
  documentacionSugerida: string[];
  disclaimer: string;
  /** Stats de encuadre (sin prometer resultado). */
  stats?: Array<{ frase: string; fuente: string; anio: number }>;
  /** Preview del próximo paso (qué pasa al clickear WhatsApp). */
  proximoPaso?: string;
  /** Diagnóstico preliminar: falta info pero vale mostrar algo. */
  esPreliminar?: boolean;
  /** Qué campos faltan para volverlo completo. */
  camposFaltantes?: string[];
  /** Nivel de urgencia detectado. */
  nivelUrgencia?: 'critica' | 'alta' | 'normal';
}

export const GraphState = Annotation.Root({
  // --- Control de flujo ---
  locale: Annotation<string>({ reducer: (_, b) => b, default: () => 'es' }),
  currentNode: Annotation<string>({ reducer: (_, b) => b, default: () => 'saludo' }),
  turnCount: Annotation<number>({ reducer: (_, b) => b, default: () => 0 }),
  turnosSinProgreso: Annotation<number>({ reducer: (_, b) => b, default: () => 0 }),
  intakeStep: Annotation<number>({ reducer: (_, b) => b, default: () => 0 }),

  // --- Datos capturados ---
  captured: Annotation<IntakeCaptured>({
    reducer: (_, b) => b,
    default: () => ({ areaConfirmada: false }),
  }),

  // --- Diagnóstico ---
  casoId: Annotation<string>({ reducer: (_, b) => b, default: () => '' }),
  diagnosticoTexto: Annotation<string>({ reducer: (_, b) => b, default: () => '' }),
  diagnosticoData: Annotation<DiagnosticoData | null>({ reducer: (_, b) => b, default: () => null }),

  // --- Flags ---
  canDiagnose: Annotation<boolean>({ reducer: (_, b) => b, default: () => false }),
  diagnosticoParcial: Annotation<boolean>({ reducer: (_, b) => b, default: () => false }),
  nivelUrgencia: Annotation<'critica' | 'alta' | 'normal'>({ reducer: (_, b) => b, default: () => 'normal' }),
  injectionDetectada: Annotation<boolean>({ reducer: (_, b) => b, default: () => false }),
  esUrgencia: Annotation<boolean>({ reducer: (_, b) => b, default: () => false }),
  esMenor: Annotation<boolean>({ reducer: (_, b) => b, default: () => false }),
  temaFueraDeConsumo: Annotation<number>({ reducer: (_, b) => b, default: () => 0 }),
  fallbackMotivo: Annotation<string>({ reducer: (_, b) => b, default: () => '' }),

  // --- Mensajes ---
  lastUserMessage: Annotation<string>({ reducer: (_, b) => b, default: () => '' }),
  messages: Annotation<ChatMessage[]>({ reducer: (_, b) => b, default: () => [] }),

  // --- Output para el frontend ---
  responseText: Annotation<string>({ reducer: (_, b) => b, default: () => '' }),
  uiComponents: Annotation<UIComponent[]>({ reducer: (_, b) => b, default: () => [] }),
});

export type GraphStateType = typeof GraphState.State;
