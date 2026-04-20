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
  tipoInput: 'seleccion' | 'texto_libre' | 'si_no';
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
// PREGUNTAS COMUNES BASE
// ============================================================

const P_RECLAMO_PREVIO: IntakeQuestionDef = {
  id: 'reclamo_previo',
  pregunta: '¿Ya reclamaste formalmente a la empresa?',
  opciones: ['Sí', 'No', 'No estoy seguro'],
  tipoInput: 'seleccion',
  campo: 'reclamoPrevio',
  esObligatorio: true,
  ayuda: 'Un reclamo formal es por mail, carta documento, o número de gestión — no una charla con un empleado.',
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
};

const P_DOCUMENTACION: IntakeQuestionDef = {
  id: 'documentacion',
  pregunta: '¿Qué documentación tenés?',
  opciones: [
    'Factura, contrato o póliza',
    'Emails o mensajes con la empresa',
    'Capturas de pantalla',
    'Número de reclamo o expediente',
    'Varios de los anteriores',
    'No tengo nada documentado',
  ],
  tipoInput: 'seleccion',
  campo: 'documentacion',
  esObligatorio: false,
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
      opciones: [
        'Cobro no autorizado o indebido',
        'No me dan la baja',
        'Cortes o fallas reiteradas',
        'Velocidad muy inferior a la contratada',
        'Portabilidad no procesada',
        'Otro',
      ],
      tipoInput: 'seleccion',
      campo: 'problema',
      esObligatorio: true,
    },
    {
      id: 'telecom_proveedor',
      pregunta: '¿Con qué empresa?',
      placeholder: 'Ej: Personal, Claro, Movistar, Telecentro...',
      opciones: [],
      tipoInput: 'texto_libre',
      campo: 'proveedor',
      esObligatorio: false,
    },
    P_FECHA_GENERICA,
    P_RECLAMO_PREVIO,
    P_DETALLE_RECLAMO,
    P_MONTO,
    P_DOCUMENTACION,
  ],

  financiero: [
    {
      id: 'fin_problema',
      pregunta: '¿Qué tipo de problema tenés?',
      opciones: [
        'Cargo o débito no reconocido',
        'Seguro o producto no contratado',
        'Comisión o tasa abusiva',
        'No me dan la baja de un producto',
        'Deuda mal informada al Veraz/BCRA',
        'Otro',
      ],
      tipoInput: 'seleccion',
      campo: 'problema',
      esObligatorio: true,
    },
    {
      id: 'fin_entidad',
      pregunta: '¿Con qué entidad?',
      placeholder: 'Ej: Galicia, Mercado Pago, Naranja X...',
      opciones: [],
      tipoInput: 'texto_libre',
      campo: 'proveedor',
      esObligatorio: false,
    },
    P_FECHA_FACTURA,
    P_RECLAMO_PREVIO,
    P_DETALLE_RECLAMO,
    P_MONTO,
    P_DOCUMENTACION,
  ],

  electrodomesticos: [
    {
      id: 'electro_problema',
      pregunta: '¿Qué pasó con el producto?',
      opciones: [
        'Falla dentro de la garantía',
        'Garantía rechazada sin justificación',
        'No me lo entregan / demora excesiva',
        'Service no repara ni reemplaza',
        'Defectuoso al desembalar',
        'Otro',
      ],
      tipoInput: 'seleccion',
      campo: 'problema',
      esObligatorio: true,
    },
    {
      id: 'electro_proveedor',
      pregunta: '¿Con qué empresa o tienda?',
      placeholder: 'Ej: Frávega, Garbarino, Samsung, fabricante...',
      opciones: [],
      tipoInput: 'texto_libre',
      campo: 'proveedor',
      esObligatorio: false,
    },
    P_FECHA_GARANTIA,
    P_RECLAMO_PREVIO,
    P_DETALLE_RECLAMO,
    P_MONTO,
    P_DOCUMENTACION,
  ],

  ecommerce: [
    {
      id: 'ecom_problema',
      pregunta: '¿Qué pasó con tu compra?',
      opciones: [
        'No llegó el producto',
        'Llegó roto o dañado',
        'Es diferente a lo publicado',
        'No me devuelven el dinero',
        'El vendedor desapareció',
        'Otro',
      ],
      tipoInput: 'seleccion',
      campo: 'problema',
      esObligatorio: true,
    },
    {
      id: 'ecom_plataforma',
      pregunta: '¿Dónde compraste?',
      placeholder: 'Ej: Mercado Libre, Tiendanube, Instagram, web propia...',
      opciones: [],
      tipoInput: 'texto_libre',
      campo: 'proveedor',
      esObligatorio: false,
    },
    P_FECHA_COMPRA_ONLINE,
    P_RECLAMO_PREVIO,
    P_DETALLE_RECLAMO,
    P_MONTO,
    P_DOCUMENTACION,
  ],

  seguros_prepaga: [
    {
      id: 'seg_tipo',
      pregunta: '¿Qué tipo de cobertura?',
      opciones: ['Medicina prepaga', 'Obra social', 'Seguro de auto', 'Seguro de hogar o vida', 'Otro seguro'],
      tipoInput: 'seleccion',
      campo: 'proveedor',
      esObligatorio: true,
    },
    {
      id: 'seg_problema',
      pregunta: '¿Qué problema tenés?',
      opciones: [
        'Rechazo de cobertura o prestación',
        'Aumento superior al permitido',
        'Demora en autorización',
        'Rescisión unilateral',
        'No cubren el siniestro',
        'Otro',
      ],
      tipoInput: 'seleccion',
      campo: 'problema',
      esObligatorio: true,
    },
    P_FECHA_GENERICA,
    P_RECLAMO_PREVIO,
    P_DETALLE_RECLAMO,
    P_MONTO,
    P_DOCUMENTACION,
  ],

  servicios_publicos: [
    {
      id: 'sp_servicio',
      pregunta: '¿Qué servicio es?',
      opciones: ['Electricidad', 'Gas', 'Agua / saneamiento'],
      tipoInput: 'seleccion',
      campo: 'proveedor',
      esObligatorio: true,
    },
    {
      id: 'sp_problema',
      pregunta: '¿Qué problema tenés?',
      opciones: [
        'Factura excesiva o error de medición',
        'Corte injustificado',
        'Mala calidad continua',
        'Demora en conexión o reconexión',
        'Cobro por servicios no prestados',
        'Otro',
      ],
      tipoInput: 'seleccion',
      campo: 'problema',
      esObligatorio: true,
    },
    P_FECHA_FACTURA,
    P_RECLAMO_PREVIO,
    P_DETALLE_RECLAMO,
    P_MONTO,
    P_DOCUMENTACION,
  ],

  turismo_aereo: [
    {
      id: 'tur_problema',
      pregunta: '¿Qué pasó?',
      opciones: [
        'Vuelo cancelado o demorado',
        'Equipaje perdido, dañado o demorado',
        'Overbooking / denegación de embarque',
        'Paquete turístico no prestado',
        'Reembolso no procesado',
        'Otro',
      ],
      tipoInput: 'seleccion',
      campo: 'problema',
      esObligatorio: true,
    },
    {
      id: 'tur_empresa',
      pregunta: '¿Con qué aerolínea o agencia?',
      placeholder: 'Ej: Aerolíneas, LATAM, Despegar, Almundo...',
      opciones: [],
      tipoInput: 'texto_libre',
      campo: 'proveedor',
      esObligatorio: false,
    },
    P_FECHA_VIAJE,
    P_RECLAMO_PREVIO,
    P_DETALLE_RECLAMO,
    P_MONTO,
    P_DOCUMENTACION,
  ],

  // Área genérica para consumos no cubiertos por las específicas:
  // educación privada, inmobiliarias (relación de consumo), gimnasios, suscripciones no telco, etc.
  otros_consumo: [
    {
      id: 'otros_problema',
      pregunta: 'Contame qué pasó en pocas palabras',
      placeholder: 'Ej: pagué un curso y no lo dieron, me cobran una membresía que cancelé...',
      opciones: [],
      tipoInput: 'texto_libre',
      campo: 'problema',
      esObligatorio: true,
    },
    {
      id: 'otros_proveedor',
      pregunta: '¿Con qué empresa o marca?',
      placeholder: 'Nombre comercial o razón social',
      opciones: [],
      tipoInput: 'texto_libre',
      campo: 'proveedor',
      esObligatorio: false,
    },
    P_FECHA_GENERICA,
    P_RECLAMO_PREVIO,
    P_DETALLE_RECLAMO,
    P_MONTO,
    P_DOCUMENTACION,
  ],
};

// ============================================================
// TRADUCCIONES AL INGLÉS
// Separadas de las definiciones para mantener el código limpio.
// ============================================================

const EN_TRANSLATIONS: Record<string, NonNullable<IntakeQuestionDef['en']>> = {
  reclamo_previo: {
    pregunta: 'Have you already filed a formal complaint with the company?',
    opciones: ['Yes', 'No', "I'm not sure"],
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
  documentacion: {
    pregunta: 'What documentation do you have?',
    opciones: [
      'Invoice, contract or policy',
      'Emails or messages with the company',
      'Screenshots',
      'Complaint or case number',
      'Several of the above',
      'I have nothing documented',
    ],
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
  telecom_problema: {
    pregunta: 'What problem do you have with the service?',
    opciones: [
      'Unauthorized or incorrect charge',
      "They won't cancel my service",
      'Repeated outages or failures',
      'Speed far below contracted rate',
      'Number portability not processed',
      'Other',
    ],
  },
  telecom_proveedor: {
    pregunta: 'Which company?',
    placeholder: 'E.g.: Personal, Claro, Movistar, Telecentro...',
  },
  fin_problema: {
    pregunta: 'What type of problem do you have?',
    opciones: [
      'Unrecognized charge or debit',
      'Insurance or product not contracted',
      'Abusive commission or rate',
      "They won't cancel a product",
      'Debt wrongly reported to credit bureau',
      'Other',
    ],
  },
  fin_entidad: {
    pregunta: 'With which institution?',
    placeholder: 'E.g.: Galicia Bank, Mercado Pago, Naranja X...',
  },
  electro_problema: {
    pregunta: 'What happened with the product?',
    opciones: [
      'Failure within warranty period',
      'Warranty rejected without justification',
      'Not delivered / excessive delay',
      'Service center not repairing or replacing',
      'Defective when unboxed',
      'Other',
    ],
  },
  electro_proveedor: {
    pregunta: 'Which company or store?',
    placeholder: 'E.g.: Frávega, Garbarino, Samsung, manufacturer...',
  },
  ecom_problema: {
    pregunta: 'What happened with your purchase?',
    opciones: [
      'Product never arrived',
      'Arrived broken or damaged',
      "Doesn't match the listing",
      "Won't refund my money",
      'Seller disappeared',
      'Other',
    ],
  },
  ecom_plataforma: {
    pregunta: 'Where did you buy?',
    placeholder: 'E.g.: Mercado Libre, Tiendanube, Instagram, brand website...',
  },
  seg_tipo: {
    pregunta: 'What type of coverage do you have?',
    opciones: [
      'Health insurance (prepaga)',
      'Social health plan (obra social)',
      'Car insurance',
      'Home or life insurance',
      'Other insurance',
    ],
  },
  seg_problema: {
    pregunta: 'What problem do you have?',
    opciones: [
      'Coverage or service denied',
      'Rate increase above the allowed limit',
      'Unjustified delay in authorization',
      'Unilateral contract termination',
      "Won't cover the filed claim",
      'Other',
    ],
  },
  sp_servicio: {
    pregunta: 'Which service is it?',
    opciones: ['Electricity', 'Gas', 'Water / sanitation'],
  },
  sp_problema: {
    pregunta: 'What problem do you have?',
    opciones: [
      'Excessive bill or metering error',
      'Unjustified service interruption',
      'Continuous poor service quality',
      'Delay in connection or reconnection',
      'Charged for services not provided',
      'Other',
    ],
  },
  tur_problema: {
    pregunta: 'What happened?',
    opciones: [
      'Flight cancelled or significantly delayed',
      'Luggage lost, damaged or delayed',
      'Overbooking / denied boarding',
      'Travel package not provided as contracted',
      'Refund not processed for cancellation',
      'Other',
    ],
  },
  tur_empresa: {
    pregunta: 'With which airline or agency?',
    placeholder: 'E.g.: Aerolíneas Argentinas, LATAM, Despegar, Almundo...',
  },
  otros_problema: {
    pregunta: 'Briefly describe what happened',
    placeholder: 'E.g.: I paid for a course that was never delivered, they keep charging for a membership I cancelled...',
  },
  otros_proveedor: {
    pregunta: 'Which company or brand?',
    placeholder: 'Business name or legal name',
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
 * Total de preguntas obligatorias para una área.
 * Lo usamos en el UI para fijar el denominador del progreso DESDE EL TURNO 1.
 */
export function getTotalQuestionsForArea(area: AreaKey): number {
  const qs = PREGUNTAS_POR_AREA[area] || [];
  // Contamos solo las obligatorias (las condicionales/opcionales son bonus).
  return qs.filter((q) => q.esObligatorio).length;
}

/**
 * Doc sugerida por área — mostrada en el diagnóstico.
 */
const DOCS_ES: Record<AreaKey, string[]> = {
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

const DOCS_EN: Record<AreaKey, string[]> = {
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
