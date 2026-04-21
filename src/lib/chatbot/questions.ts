// src/lib/chatbot/questions.ts
/**
 * Lookup tables de preguntas por área.
 * Cada área pregunta solo lo legalmente distintivo.
 * Las preguntas están ordenadas por importancia legal y menor fricción.
 */

import type { AreaKey } from './state';

export interface IntakeQuestionDef {
  id: string;
  pregunta: string;
  placeholder?: string;
  opciones: string[];
  tipoInput: 'seleccion' | 'texto_libre' | 'si_no' | 'checklist';
  campo: keyof IntakeFieldMap;
  esObligatorio: boolean;
  /** Si retorna false, la pregunta se omite. */
  condicion?: (captured: Record<string, unknown>) => boolean;
  /** Texto de ayuda opcional para el usuario (tooltip o subtexto). */
  ayuda?: string;
  /** English translations that override the Spanish defaults. */
  en?: {
    pregunta?: string;
    opciones?: string[];
    placeholder?: string;
    ayuda?: string;
  };
}

interface IntakeFieldMap {
  problema: string;
  proveedor: string;
  tiempo: string;
  monto: string;
  reclamoPrevio: string;
  detalleReclamo: string;
  documentacion: string;
}

// ============================================================
// DOCUMENTACIÓN SUGERIDA POR ÁREA (usada tanto en checklist como en la card)
// ============================================================

export const DOCS_ES: Record<AreaKey, string[]> = {
  telecomunicaciones: [
    'Facturas donde figure el cobro indebido',
    'Capturas del error o falla',
    'Número de reclamo ante la empresa',
    'Contrato o condiciones del servicio',
  ],
  financiero: [
    'Resumen de cuenta o extracto',
    'Comprobante de impugnación del cargo',
    'Contrato o solicitud del producto',
    'Capturas de la operación no reconocida',
  ],
  electrodomesticos: [
    'Factura o ticket de compra (con fecha)',
    'Certificado de garantía',
    'Fotos o video del defecto',
    'Constancia de ingreso al service',
  ],
  ecommerce: [
    'Capturas de la publicación original',
    'Comprobante de pago',
    'Conversaciones con el vendedor',
    'Foto del producto recibido',
  ],
  seguros_prepaga: [
    'Póliza o contrato vigente',
    'Nota de rechazo o resolución denegatoria',
    'Prescripción médica (si aplica)',
    'Comprobantes de pago de cuota',
  ],
  servicios_publicos: [
    'Últimas 3 facturas',
    'Foto del medidor con fecha',
    'Número de reclamo ante la distribuidora',
    'Comunicaciones escritas con la empresa',
  ],
  turismo_aereo: [
    'Pasaje o confirmación de reserva',
    'Comunicación oficial de cancelación',
    'Comprobantes de gastos extra (hotel, comida)',
    'Foto del equipaje dañado con etiqueta',
  ],
  otros_consumo: [
    'Factura, contrato o comprobante de pago',
    'Publicidad o letra del servicio contratado',
    'Comunicaciones con la empresa (mails, chats)',
    'Cualquier documento que acredite la relación de consumo',
  ],
};

export const DOCS_EN: Record<AreaKey, string[]> = {
  telecomunicaciones: [
    'Invoices showing the disputed charge',
    'Screenshots of the error or service failure',
    'Complaint number filed with the company',
    'Service contract or terms and conditions',
  ],
  financiero: [
    'Account statement or bank extract',
    'Proof of charge dispute',
    'Product contract or application form',
    'Screenshots of the unrecognized transaction',
  ],
  electrodomesticos: [
    'Purchase invoice or receipt (with date)',
    'Warranty certificate',
    'Photos or video of the defect',
    'Proof of drop-off at the service center',
  ],
  ecommerce: [
    'Screenshots of the original listing',
    'Proof of payment',
    'Conversations with the seller',
    'Photo of the product received',
  ],
  seguros_prepaga: [
    'Active policy or contract',
    'Rejection notice or denial resolution',
    'Medical prescription (if applicable)',
    'Premium payment receipts',
  ],
  servicios_publicos: [
    'Last 3 bills',
    'Photo of the meter with date',
    'Complaint number filed with the utility',
    'Written communications with the company',
  ],
  turismo_aereo: [
    'Ticket or booking confirmation',
    'Official cancellation communication',
    'Receipts for extra expenses (hotel, food)',
    'Photo of damaged luggage with tag',
  ],
  otros_consumo: [
    'Invoice, contract or proof of payment',
    'Advertising or terms of the contracted service',
    'Communications with the company (emails, chats)',
    'Any document proving the consumer relationship',
  ],
};

export function getSuggestedDocs(area: AreaKey, locale = 'es'): string[] {
  const docs = locale === 'en' ? DOCS_EN : DOCS_ES;
  return docs[area] || (locale === 'en'
    ? ['Any documentation you have related to the problem']
    : ['Cualquier comprobante que tengas del problema']);
}

function makeDocumentacionQuestion(area: AreaKey): IntakeQuestionDef {
  return {
    id: 'documentacion',
    pregunta: '¿Con qué documentación contás? Marcá todo lo que tengas.',
    opciones: DOCS_ES[area] ?? DOCS_ES.otros_consumo,
    tipoInput: 'checklist',
    campo: 'documentacion',
    esObligatorio: false,
    en: {
      pregunta: 'What documentation do you have? Check everything that applies.',
      opciones: DOCS_EN[area] ?? DOCS_EN.otros_consumo,
    },
  };
}

// ============================================================
// PREGUNTAS COMUNES BASE
// ============================================================

const P_RECLAMO_PREVIO: IntakeQuestionDef = {
  id: 'reclamo_previo',
  pregunta: '¿Ya reclamaste formalmente a la empresa?',
  placeholder: 'Ej: sí, mandé un mail en enero / no, todavía no reclamé',
  opciones: [],
  tipoInput: 'texto_libre',
  campo: 'reclamoPrevio',
  esObligatorio: true,
  ayuda: 'Un reclamo formal es por mail, carta documento, o número de gestión — no una charla con un empleado.',
  en: {
    pregunta: 'Have you already filed a formal complaint with the company?',
    placeholder: 'E.g.: yes, sent an email in January / no, not yet',
    ayuda: 'A formal complaint is via email, certified letter, or complaint number — not a verbal conversation with a customer rep.',
  },
};

const P_DETALLE_RECLAMO: IntakeQuestionDef = {
  id: 'detalle_reclamo',
  pregunta: '¿Cuándo reclamaste y qué te respondieron?',
  placeholder: 'Ej: reclamé en febrero, me ignoraron / me dijeron que no corresponde',
  opciones: [],
  tipoInput: 'texto_libre',
  campo: 'detalleReclamo',
  esObligatorio: false,
  condicion: (captured) => {
    const reclamo = captured['reclamoPrevio'] as { realizado: boolean } | undefined;
    return !!(reclamo && reclamo.realizado === true);
  },
  en: {
    pregunta: 'When did you complain and what was their response?',
    placeholder: 'E.g.: complained in February, they ignored me / said it was not applicable',
  },
};

const P_MONTO: IntakeQuestionDef = {
  id: 'monto',
  pregunta: '¿Cuánto dinero aproximado está en juego?',
  placeholder: 'Ej: $80.000, más de un millón, no sé exactamente',
  opciones: [],
  tipoInput: 'texto_libre',
  campo: 'monto',
  esObligatorio: false,
  ayuda: 'Si no lo sabés exacto, un rango aproximado ayuda igual.',
  en: {
    pregunta: 'How much money is approximately at stake?',
    placeholder: 'E.g.: $80,000, over $1M ARS, not sure exactly',
    ayuda: 'An approximate range is helpful even if you are not sure of the exact figure.',
  },
};

// ============================================================
// PREGUNTAS DE FECHA — ADAPTADAS POR ÁREA
// ============================================================
// La fecha es crítica para evaluar prescripción. Lo que se pregunta
// cambia según el área porque el "hecho generador" cambia.

const P_FECHA_GENERICA: IntakeQuestionDef = {
  id: 'fecha_hecho',
  pregunta: '¿Cuándo ocurrió el problema?',
  placeholder: 'Ej: marzo 2024, hace 8 meses, el 15/01/2025',
  opciones: [],
  tipoInput: 'texto_libre',
  campo: 'tiempo',
  esObligatorio: true,
};

const P_FECHA_GARANTIA: IntakeQuestionDef = {
  id: 'fecha_compra',
  pregunta: '¿Cuándo compraste el producto y cuándo apareció la falla?',
  placeholder: 'Ej: compré en febrero 2024, empezó a fallar en julio',
  opciones: [],
  tipoInput: 'texto_libre',
  campo: 'tiempo',
  esObligatorio: true,
};

const P_FECHA_VIAJE: IntakeQuestionDef = {
  id: 'fecha_viaje',
  pregunta: '¿Cuándo era el viaje y cuándo ocurrió el problema?',
  placeholder: 'Ej: volaba el 15/3 y cancelaron el día anterior',
  opciones: [],
  tipoInput: 'texto_libre',
  campo: 'tiempo',
  esObligatorio: true,
};

const P_FECHA_COMPRA_ONLINE: IntakeQuestionDef = {
  id: 'fecha_compra_online',
  pregunta: '¿Cuándo compraste y cuándo ocurrió el problema?',
  placeholder: 'Ej: compré el 3/3 y nunca llegó, o llegó roto',
  opciones: [],
  tipoInput: 'texto_libre',
  campo: 'tiempo',
  esObligatorio: true,
};

const P_FECHA_FACTURA: IntakeQuestionDef = {
  id: 'fecha_factura',
  pregunta: '¿De qué período es la factura o cuándo notaste el error?',
  placeholder: 'Ej: factura de marzo, lo noté al revisar el resumen',
  opciones: [],
  tipoInput: 'texto_libre',
  campo: 'tiempo',
  esObligatorio: true,
};

// ============================================================
// PREGUNTAS POR ÁREA
// ============================================================

const PREGUNTAS_POR_AREA: Record<AreaKey, IntakeQuestionDef[]> = {
  telecomunicaciones: [
    {
      id: 'telecom_problema',
      pregunta: '¿Qué problema tenés con el servicio?',
      placeholder: 'Ej: me cobran un cargo que no reconozco, no me dan la baja, internet no funciona...',
      opciones: [],
      tipoInput: 'texto_libre',
      campo: 'problema',
      esObligatorio: true,
      en: { pregunta: 'What problem do you have with the service?', placeholder: 'E.g.: unrecognized charge, they won\'t cancel, internet keeps failing...' },
    },
    {
      id: 'telecom_proveedor',
      pregunta: '¿Con qué empresa?',
      placeholder: 'Ej: Personal, Claro, Movistar, Telecentro...',
      opciones: [],
      tipoInput: 'texto_libre',
      campo: 'proveedor',
      esObligatorio: false,
      en: { pregunta: 'Which company?', placeholder: 'E.g.: Personal, Claro, Movistar, Telecentro...' },
    },
    P_FECHA_GENERICA,
    P_RECLAMO_PREVIO,
    P_DETALLE_RECLAMO,
    P_MONTO,
    makeDocumentacionQuestion('telecomunicaciones'),
  ],

  financiero: [
    {
      id: 'fin_problema',
      pregunta: '¿Qué tipo de problema tenés?',
      placeholder: 'Ej: cargo no reconocido, seguro que no contraté, comisión abusiva, deuda en Veraz...',
      opciones: [],
      tipoInput: 'texto_libre',
      campo: 'problema',
      esObligatorio: true,
      en: { pregunta: 'What type of problem do you have?', placeholder: 'E.g.: unrecognized charge, product I didn\'t contract, abusive fee, wrong credit bureau report...' },
    },
    {
      id: 'fin_entidad',
      pregunta: '¿Con qué entidad?',
      placeholder: 'Ej: Galicia, Mercado Pago, Naranja X...',
      opciones: [],
      tipoInput: 'texto_libre',
      campo: 'proveedor',
      esObligatorio: false,
      en: { pregunta: 'With which institution?', placeholder: 'E.g.: Galicia Bank, Mercado Pago, Naranja X...' },
    },
    P_FECHA_FACTURA,
    P_RECLAMO_PREVIO,
    P_DETALLE_RECLAMO,
    P_MONTO,
    makeDocumentacionQuestion('financiero'),
  ],

  electrodomesticos: [
    {
      id: 'electro_problema',
      pregunta: '¿Qué pasó con el producto?',
      placeholder: 'Ej: falló dentro de la garantía, no me lo reparan, llegó defectuoso...',
      opciones: [],
      tipoInput: 'texto_libre',
      campo: 'problema',
      esObligatorio: true,
      en: { pregunta: 'What happened with the product?', placeholder: 'E.g.: failed within warranty, they won\'t repair it, arrived defective...' },
    },
    {
      id: 'electro_proveedor',
      pregunta: '¿Con qué empresa o tienda?',
      placeholder: 'Ej: Frávega, Garbarino, Samsung, fabricante...',
      opciones: [],
      tipoInput: 'texto_libre',
      campo: 'proveedor',
      esObligatorio: false,
      en: { pregunta: 'Which company or store?', placeholder: 'E.g.: Frávega, Garbarino, Samsung, manufacturer...' },
    },
    P_FECHA_GARANTIA,
    P_RECLAMO_PREVIO,
    P_DETALLE_RECLAMO,
    P_MONTO,
    makeDocumentacionQuestion('electrodomesticos'),
  ],

  ecommerce: [
    {
      id: 'ecom_problema',
      pregunta: '¿Qué pasó con tu compra?',
      placeholder: 'Ej: no llegó el producto, llegó roto, es diferente a lo publicado, no me devuelven el dinero...',
      opciones: [],
      tipoInput: 'texto_libre',
      campo: 'problema',
      esObligatorio: true,
      en: { pregunta: 'What happened with your purchase?', placeholder: 'E.g.: product never arrived, arrived broken, doesn\'t match listing, won\'t refund...' },
    },
    {
      id: 'ecom_plataforma',
      pregunta: '¿Dónde compraste?',
      placeholder: 'Ej: Mercado Libre, Tiendanube, Instagram, web propia...',
      opciones: [],
      tipoInput: 'texto_libre',
      campo: 'proveedor',
      esObligatorio: false,
      en: { pregunta: 'Where did you buy?', placeholder: 'E.g.: Mercado Libre, Tiendanube, Instagram, brand website...' },
    },
    P_FECHA_COMPRA_ONLINE,
    P_RECLAMO_PREVIO,
    P_DETALLE_RECLAMO,
    P_MONTO,
    makeDocumentacionQuestion('ecommerce'),
  ],

  seguros_prepaga: [
    {
      id: 'seg_tipo',
      pregunta: '¿Qué tipo de cobertura y cuál es el problema?',
      placeholder: 'Ej: prepaga me rechazó una práctica, seguro de auto no cubre el siniestro, me aumentaron sin aviso...',
      opciones: [],
      tipoInput: 'texto_libre',
      campo: 'problema',
      esObligatorio: true,
      en: { pregunta: 'What type of coverage and what is the problem?', placeholder: 'E.g.: health plan denied a procedure, car insurance won\'t cover claim, unexpected rate increase...' },
    },
    {
      id: 'seg_proveedor',
      pregunta: '¿Con qué empresa?',
      placeholder: 'Ej: OSDE, Swiss Medical, Galeno, La Caja...',
      opciones: [],
      tipoInput: 'texto_libre',
      campo: 'proveedor',
      esObligatorio: false,
      en: { pregunta: 'Which company?', placeholder: 'E.g.: OSDE, Swiss Medical, Galeno, La Caja...' },
    },
    P_FECHA_GENERICA,
    P_RECLAMO_PREVIO,
    P_DETALLE_RECLAMO,
    P_MONTO,
    makeDocumentacionQuestion('seguros_prepaga'),
  ],

  servicios_publicos: [
    {
      id: 'sp_servicio',
      pregunta: '¿Qué servicio y cuál es el problema?',
      placeholder: 'Ej: Edenor me cobra de más, corte de gas sin aviso, agua con mala presión...',
      opciones: [],
      tipoInput: 'texto_libre',
      campo: 'problema',
      esObligatorio: true,
      en: { pregunta: 'Which service and what is the problem?', placeholder: 'E.g.: electricity overcharge, gas cut without notice, poor water pressure...' },
    },
    {
      id: 'sp_proveedor',
      pregunta: '¿Con qué empresa distribuidora?',
      placeholder: 'Ej: Edenor, Edesur, Metrogas, AySA...',
      opciones: [],
      tipoInput: 'texto_libre',
      campo: 'proveedor',
      esObligatorio: false,
      en: { pregunta: 'Which distribution company?', placeholder: 'E.g.: Edenor, Edesur, Metrogas, AySA...' },
    },
    P_FECHA_FACTURA,
    P_RECLAMO_PREVIO,
    P_DETALLE_RECLAMO,
    P_MONTO,
    makeDocumentacionQuestion('servicios_publicos'),
  ],

  turismo_aereo: [
    {
      id: 'tur_problema',
      pregunta: '¿Qué pasó?',
      placeholder: 'Ej: me cancelaron el vuelo, perdieron mi equipaje, no me dejaron embarcar, el paquete no fue como prometido...',
      opciones: [],
      tipoInput: 'texto_libre',
      campo: 'problema',
      esObligatorio: true,
      en: { pregunta: 'What happened?', placeholder: 'E.g.: flight cancelled, luggage lost, denied boarding, travel package not as promised...' },
    },
    {
      id: 'tur_empresa',
      pregunta: '¿Con qué aerolínea o agencia?',
      placeholder: 'Ej: Aerolíneas, LATAM, Despegar, Almundo...',
      opciones: [],
      tipoInput: 'texto_libre',
      campo: 'proveedor',
      esObligatorio: false,
      en: { pregunta: 'With which airline or agency?', placeholder: 'E.g.: Aerolíneas Argentinas, LATAM, Despegar, Almundo...' },
    },
    P_FECHA_VIAJE,
    P_RECLAMO_PREVIO,
    P_DETALLE_RECLAMO,
    P_MONTO,
    makeDocumentacionQuestion('turismo_aereo'),
  ],

  otros_consumo: [
    {
      id: 'otros_problema',
      pregunta: 'Contame qué pasó en pocas palabras',
      placeholder: 'Ej: pagué un curso y no lo dieron, me cobran una membresía que cancelé...',
      opciones: [],
      tipoInput: 'texto_libre',
      campo: 'problema',
      esObligatorio: true,
      en: { pregunta: 'Briefly describe what happened', placeholder: 'E.g.: I paid for a course that was never delivered, they keep charging for a membership I cancelled...' },
    },
    {
      id: 'otros_proveedor',
      pregunta: '¿Con qué empresa o marca?',
      placeholder: 'Nombre comercial o razón social',
      opciones: [],
      tipoInput: 'texto_libre',
      campo: 'proveedor',
      esObligatorio: false,
      en: { pregunta: 'Which company or brand?', placeholder: 'Business name or legal name' },
    },
    P_FECHA_GENERICA,
    P_RECLAMO_PREVIO,
    P_DETALLE_RECLAMO,
    P_MONTO,
    makeDocumentacionQuestion('otros_consumo'),
  ],
};

// ============================================================
// TRADUCCIONES AL INGLÉS
// Separadas de las definiciones para mantener el código limpio.
// ============================================================

const EN_TRANSLATIONS: Record<string, NonNullable<IntakeQuestionDef['en']>> = {
  reclamo_previo: {
    pregunta: 'Have you already filed a formal complaint with the company?',
    placeholder: 'E.g.: yes, sent an email in January / no, not yet',
    ayuda: 'A formal complaint is via email, certified letter, or complaint number — not a verbal conversation with a customer rep.',
  },
  detalle_reclamo: {
    pregunta: 'When did you complain and what was their response?',
    placeholder: 'E.g.: complained in February, they ignored me / said it was not applicable',
  },
  monto: {
    pregunta: 'How much money is approximately at stake?',
    placeholder: 'E.g.: $80,000, over $1M ARS, not sure exactly',
    ayuda: 'An approximate range is helpful even if you are not sure of the exact figure.',
  },
  fecha_hecho: {
    pregunta: 'When did the problem occur?',
    placeholder: 'E.g.: March 2024, 8 months ago, on 01/15/2025',
  },
  fecha_compra: {
    pregunta: 'When did you buy the product and when did the fault appear?',
    placeholder: 'E.g.: bought in February 2024, started failing in July',
  },
  fecha_viaje: {
    pregunta: 'When was the trip and when did the problem occur?',
    placeholder: 'E.g.: flying on 3/15 and they cancelled the day before',
  },
  fecha_compra_online: {
    pregunta: 'When did you buy and when did the problem occur?',
    placeholder: 'E.g.: bought on 3/3 and it never arrived, or arrived damaged',
  },
  fecha_factura: {
    pregunta: 'Which billing period is the invoice from, or when did you notice the error?',
    placeholder: 'E.g.: March invoice, noticed when reviewing the statement',
  },
};

/**
 * Returns a question with strings in the requested locale.
 * Falls back to Spanish if no translation exists.
 */
export function localizeQuestion(q: IntakeQuestionDef, locale: string): IntakeQuestionDef {
  if (locale !== 'en') return q;
  const tr = q.en ?? EN_TRANSLATIONS[q.id];
  if (!tr) return q;
  return {
    ...q,
    pregunta: tr.pregunta ?? q.pregunta,
    opciones: tr.opciones ?? q.opciones,
    placeholder: tr.placeholder ?? q.placeholder,
    ayuda: tr.ayuda ?? q.ayuda,
  };
}

// ============================================================
// FUNCIONES EXPORTADAS
// ============================================================

/**
 * Retorna la siguiente pregunta pendiente, localizada al idioma solicitado.
 * Omite: (a) ya capturadas, (b) que no cumplen condición.
 */
export function getNextQuestion(
  area: AreaKey,
  step: number,
  captured: Record<string, unknown>,
  locale = 'es'
): IntakeQuestionDef | null {
  const questions = PREGUNTAS_POR_AREA[area] || [];
  for (let i = step; i < questions.length; i++) {
    const q = questions[i];
    if (q.condicion && !q.condicion(captured)) continue;
    if (captured[q.campo]) continue;
    return localizeQuestion(q, locale);
  }
  return null;
}

/**
 * Computa el número de paso actual y total de forma dinámica,
 * contando solo preguntas no-condicionales + condicionales cuya condición se cumple.
 */
export function computePasoInfo(
  area: AreaKey,
  nextStep: number,
  captured: Record<string, unknown>,
): { pasoActual: number; pasoTotal: number } {
  const qs = PREGUNTAS_POR_AREA[area] || [];
  const isVisible = (q: IntakeQuestionDef) => !q.condicion || q.condicion(captured);
  const pasoActual = qs.slice(0, nextStep + 1).filter(isVisible).length;
  const pasoTotal = qs.filter(isVisible).length;
  return { pasoActual, pasoTotal };
}

/**
 * Diagnóstico preliminar: se puede generar con problema + (tiempo O reclamoPrevio).
 * Diagnóstico completo: problema + tiempo + reclamoPrevio respondido.
 */
export function canGeneratePreliminaryDiagnosis(captured: Record<string, unknown>): boolean {
  return !!(captured.problema && (captured.tiempo || captured.reclamoPrevio !== undefined));
}

export function canGenerateDiagnosis(captured: Record<string, unknown>): boolean {
  return !!(
    captured.problema &&
    captured.tiempo &&
    captured.reclamoPrevio !== undefined
  );
}

/**
 * Total de preguntas para una área (para referencia externa).
 */
export function getTotalQuestionsForArea(area: AreaKey): number {
  return (PREGUNTAS_POR_AREA[area] || []).length;
}
