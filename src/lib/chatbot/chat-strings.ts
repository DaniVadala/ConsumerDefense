/**
 * Bilingual static strings for chatbot nodes.
 * All text that the bot generates outside of LLM calls lives here.
 * Rule: never add a hardcoded Spanish string directly in nodes — use str() instead.
 */

import type { AreaKey } from './state';

type Locale = string;

// ============================================================
// AREA LABELS
// ============================================================

export const AREAS_LABELS: Record<Locale, Record<AreaKey, string>> = {
  es: {
    telecomunicaciones: 'Telecomunicaciones',
    financiero: 'Bancos y tarjetas',
    electrodomesticos: 'Electrodomésticos y garantía',
    ecommerce: 'Compras online',
    seguros_prepaga: 'Seguros o prepaga',
    servicios_publicos: 'Servicios públicos',
    turismo_aereo: 'Turismo y vuelos',
    otros_consumo: 'Otro problema de consumo',
  },
  en: {
    telecomunicaciones: 'Telecommunications',
    financiero: 'Banks & cards',
    electrodomesticos: 'Appliances & warranty',
    ecommerce: 'Online shopping',
    seguros_prepaga: 'Insurance or health plan',
    servicios_publicos: 'Utility services',
    turismo_aereo: 'Travel & flights',
    otros_consumo: 'Other consumer issue',
  },
};

/** Returns the area label in the given locale (falls back to Spanish). */
export function getAreaLabel(area: AreaKey, locale: Locale): string {
  return (AREAS_LABELS[locale] ?? AREAS_LABELS.es)[area] ?? AREAS_LABELS.es[area];
}

/** All labels for an area across all locales — used for button-click matching. */
export function getAllAreaLabels(area: AreaKey): string[] {
  return Object.values(AREAS_LABELS).map((map) => map[area]).filter(Boolean);
}

/** Build the areas array for the areaSelector UI component. */
export function buildAreaList(locale: Locale): Array<{ key: string; label: string }> {
  const labels = AREAS_LABELS[locale] ?? AREAS_LABELS.es;
  return Object.entries(labels).map(([key, label]) => ({ key, label }));
}

// ============================================================
// NODE STRINGS
// ============================================================

const NODE_STRINGS = {
  es: {
    respectRequest:
      'Mantengamos el respeto para poder ayudarte. Si preferís, te conecto con un abogado.',
    outOfScope:
      'Solo puedo orientarte en temas de defensa del consumidor. Si tuviste un problema con una empresa, banco o servicio, contame.',
    outOfScopeRepeated:
      'Ese tema excede mi área. Para temas que no sean de consumo, te sugerimos consultar con un abogado especialista.',
    areaPrompt: '¿En qué área encaja mejor tu problema?',
    areaRetry: '¿Podrías decirme con qué tipo de empresa o servicio tuviste el problema?',
    connectLawyer: 'Te conecto con un abogado.',
    connectLawyerPolite: 'Por supuesto. Te conecto con un abogado ahora mismo.',
    noProgressFallback: 'Para avanzar mejor con tu caso, te conecto con un abogado directamente.',
    diagIntro: 'Acá tenés tu diagnóstico preliminar y las vías para reclamar:',
    urgencyIntro: 'Es una situación urgente. Te paso recursos de ayuda inmediata:',
    preliminary: 'Diagnóstico preliminar',
    preliminaryBadge: 'Diagnóstico preliminar',
    criticalUrgency: 'Situación crítica: conviene actuar sin demora.',
    highUrgency: 'Situación con urgencia temporal o económica.',
    notSpecified: 'No especificado',
    turnLimitFallback: 'Para darte la mejor orientación, te conecto con un abogado.',
  },
  en: {
    respectRequest:
      'Please keep the conversation respectful so I can help you. If you prefer, I can connect you with a lawyer.',
    outOfScope:
      'I can only assist with consumer rights issues. If you had a problem with a company, bank, or service, tell me about it.',
    outOfScopeRepeated:
      'That topic is outside my area. For non-consumer matters, we recommend consulting a specialist lawyer.',
    areaPrompt: 'Which area best describes your issue?',
    areaRetry: 'Could you tell me what type of company or service you had a problem with?',
    connectLawyer: "I'll connect you with a lawyer.",
    connectLawyerPolite: 'Of course. Connecting you with a lawyer right now.',
    noProgressFallback: "To move forward with your case, I'll connect you directly with a lawyer.",
    diagIntro: "Here's your preliminary diagnosis and the available paths to file a claim:",
    urgencyIntro: "This is an urgent situation. Here are resources for immediate assistance:",
    preliminary: 'Preliminary diagnosis',
    preliminaryBadge: 'Preliminary diagnosis',
    criticalUrgency: 'Critical situation: it is advisable to act without delay.',
    highUrgency: 'Time-sensitive or financially urgent situation.',
    notSpecified: 'Not specified',
    turnLimitFallback: "To give you the best guidance, I'll connect you with a lawyer.",
  },
} as const;

type StringKey = keyof typeof NODE_STRINGS.es;

/** Get a bilingual static string for a node response. */
export function str(locale: Locale, key: StringKey): string {
  const lang = locale === 'en' ? 'en' : 'es';
  return NODE_STRINGS[lang][key];
}
