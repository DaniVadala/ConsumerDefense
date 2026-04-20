// src/lib/chatbot/urgency-detector.ts
/**
 * Detección multi-patrón de urgencias.
 * Regex-only (zero cost) en primera pasada; el LLM puede refinar después.
 *
 * Niveles:
 *   - critica: redirección inmediata a abogado o a servicio de emergencia.
 *   - alta: acelerar flujo y marcar el diagnóstico como urgente.
 *   - normal: flujo estándar.
 */

export type NivelUrgencia = 'critica' | 'alta' | 'normal';

export interface UrgenciaDetectada {
  nivel: NivelUrgencia;
  motivo: string;
  recurso?: string;
  contacto?: string;
}

const PATRONES_CRITICOS: Array<{
  patron: RegExp;
  motivo: string;
  recurso: string;
  contacto?: string;
}> = [
  // Rechazo de cobertura de salud con tratamiento en curso
  {
    patron: /\b(prepaga|obra\s+social).*?(rechaz|negar|no\s+cubr|cort[óao]\s+cobertura).*?(tratamiento|operaci[óo]n|cirug[ií]a|medicaci[óo]n|quimio|oncol|di[áa]lisis|urgencia\s+m[eé]dica)/i,
    motivo: 'Rechazo de cobertura de salud con tratamiento en curso',
    recurso: 'Superintendencia de Servicios de Salud — línea gratuita',
    contacto: '0800-222-72583',
  },
  {
    patron: /\b(tratamiento|operaci[óo]n|medicaci[óo]n|quimio|di[áa]lisis).*?(no\s+me\s+cubr|me\s+niegan|rechaz)/i,
    motivo: 'Prestación médica prescripta no cubierta',
    recurso: 'Superintendencia de Servicios de Salud',
    contacto: '0800-222-72583',
  },
  // Citación judicial / carta documento / intimación
  {
    patron: /\b(me\s+lleg[óo]\s+(una\s+)?carta\s+documento|recib[ií]\s+(una\s+)?carta\s+documento|me\s+citaron\s+a\s+(juicio|mediaci[óo]n)|me\s+intimaron|me\s+notificaron\s+(demanda|juicio))/i,
    motivo: 'Notificación judicial o carta documento recibida',
    recurso: 'Abogado matriculado — contacto inmediato',
  },
  // Corte de servicio esencial con persona vulnerable
  {
    patron: /\b(cortaron|sin)\s+(luz|electricidad|gas|agua).*?(bebe|beb[eé]|embaraz|ni[ñn]o\s+chico|anciano|abuelo|discapac|oxigeno|respirador|tratamiento)/i,
    motivo: 'Corte de servicio esencial con persona vulnerable',
    recurso: 'Ente regulador (ENRE / ENARGAS) + WhatsApp DefensaYa',
  },
  // Cancelación de vuelo inminente
  {
    patron: /\b(cancelaron|me\s+cancelaron)\s+(el\s+)?vuelo.*?(hoy|ma[ñn]ana|en\s+\d+\s+horas?|estoy\s+varado|estoy\s+en\s+el\s+aeropuerto)/i,
    motivo: 'Vuelo cancelado con pasajero varado',
    recurso: 'Aerolínea + abogado en paralelo',
  },
];

const PATRONES_ALTA: RegExp[] = [
  // Prescripción inminente (hecho viejo)
  /\b(hace\s+(casi\s+)?(2|3|4|5)\s+a[ñn]os|en\s+20(1[89]|2[012]))/i,
  // Reporte Veraz / BCRA afectando operación en curso
  /\b(veraz|BCRA|central\s+de\s+deudores).*?(hipoteca|cr[eé]dito|alquiler|compra\s+en\s+cuotas)/i,
  // Cobradores hostigando
  /\b(llam(an|aron)|amenaz|hostig|acos).*?(cobrador|agencia\s+de\s+cobro|estudio\s+de\s+cobranza)/i,
  // Servicio esencial cortado sin persona vulnerable explícita (pero igualmente urgente)
  /\b(cortaron|sin)\s+(luz|electricidad|gas|agua)\b/i,
  // Plazo de revocación e-commerce (10 días corridos)
  /\b(compr[eé]|recib[ií])\s+hace\s+(poco|\d+\s+d[ií]as).*(quiero\s+devolver|no\s+quiero|arrepent)/i,
];

export function detectarUrgencia(texto: string): UrgenciaDetectada {
  for (const { patron, motivo, recurso, contacto } of PATRONES_CRITICOS) {
    if (patron.test(texto)) return { nivel: 'critica', motivo, recurso, contacto };
  }
  for (const patron of PATRONES_ALTA) {
    if (patron.test(texto)) return { nivel: 'alta', motivo: 'Situación con urgencia temporal o económica' };
  }
  return { nivel: 'normal', motivo: '' };
}

export function detectarMenorDeEdad(texto: string): boolean {
  return /\b(soy\s+menor|tengo\s+(1[0-7]|[1-9])\s+a[ñn]os|voy\s+al\s+(colegio|secundario)|mis\s+padres\s+no\s+saben)\b/i.test(texto);
}
