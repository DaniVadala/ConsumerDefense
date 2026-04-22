// src/lib/chatbot/types.ts
// Types for the LLM-driven consumer rights chatbot

export type ChatAction = 'message' | 'diagnosis' | 'whatsapp' | 'respect';

export interface PlazosData {
  /** 'vigente' | 'proximo_a_vencer' | 'prescripto' | 'no_precisado' */
  estado: 'vigente' | 'proximo_a_vencer' | 'prescripto' | 'no_precisado';
  /** Expiry date "DD/MM/YYYY", or null if date not provided */
  vencimiento: string | null;
  /** e.g. "Art. 50 Ley 24.240 – 3 años" */
  base_legal: string;
  /** Human-readable explanation of the deadline */
  explicacion: string;
}

export interface DiagnosisData {
  area: string;
  empresa: string;
  descripcion: string;
  fecha_hechos: string;
  monto: string | null;
  reclamo_previo: string;
  documentacion_disponible: string;
  /** 'parcial'/'total' in ES; 'partial'/'complete' in EN */
  nivel_prueba: string;
  /** Why partial, or confirmation of strength if complete */
  nivel_prueba_explicacion: string;
  /** Prescription/limitation period calculation */
  plazos: PlazosData | null;
  pasos_siguientes: string[];
  tipos_danos: string[];
  documentacion_recomendada: string[];
  normativa: string[];
}

/**
 * Fields the LLM has identified in the conversation so far.
 * Returned on every response and sent back by the client each turn
 * so the server can build an accurate field-status checklist even
 * for companies / dates the regex doesn't recognise.
 */
export interface FieldsExtracted {
  empresa: string | null;
  fecha_hechos: string | null;
  monto: string | null;
  reclamo_previo: boolean;
  documentacion: boolean;
  /** Running count of incoherent / contradictory / repeated user answers.
   * Incremented by the LLM each turn it detects confusion. Never decremented.
   * Server triggers WhatsApp fallback when this reaches 2. */
  confusion_count: number;
}

export interface ChatApiResponse {
  action: ChatAction;
  text: string;
  diagnosis: DiagnosisData | null;
  fields_extracted?: FieldsExtracted;
  /** True when the failure is transient (rate-limit, network). Client should
   * roll back the user message and let the user resend — do NOT inject this
   * response into the conversation history sent to the LLM. */
  retryable?: boolean;
  error?: string;
}
