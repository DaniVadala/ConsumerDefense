// src/lib/chatbot/empathy.ts
import type { AreaKey } from './state';

interface EmpatiaSet {
  apertura: string;
  previoDiagnostico: string;
}

const EMPATIA_ES: Record<AreaKey, EmpatiaSet> = {
  telecomunicaciones: {
    apertura: 'Los problemas con las telcos son de los más frecuentes en Argentina y desgastan un montón. Vamos a ordenarlo.',
    previoDiagnostico: 'Sé que pelearla con una compañía de teléfono o internet cansa. Te paso las opciones ordenadas.',
  },
  financiero: {
    apertura: 'Los cargos no reconocidos o los problemas con bancos y tarjetas son de los casos más claros para reclamar. Vamos paso a paso.',
    previoDiagnostico: 'Cuando aparece un movimiento que no hiciste o una deuda mal informada, lo primero es entender qué herramientas tenés. Acá están:',
  },
  electrodomesticos: {
    apertura: 'Cuando la garantía no se respeta, uno siente que pagó por nada. La ley te respalda en varios puntos, vamos a verlo.',
    previoDiagnostico: 'La garantía legal es un derecho del consumidor, no un favor de la tienda. Te paso las vías para hacerla valer:',
  },
  ecommerce: {
    apertura: 'Comprás online y cuando hay problemas el vendedor desaparece o te tira la pelota afuera. Es frustrante pero hay cómo reclamar.',
    previoDiagnostico: 'En compras a distancia tenés protecciones específicas por ser consumidor. Acá están las vías disponibles:',
  },
  seguros_prepaga: {
    apertura: 'Cuando una prepaga o un seguro niega algo que pagaste, especialmente si es por tu salud, el stress es enorme. Vamos a ver qué opciones tenés.',
    previoDiagnostico: 'Tanto las prepagas como las aseguradoras están reguladas por organismos que pueden intervenir. Te paso el panorama:',
  },
  servicios_publicos: {
    apertura: 'Un corte o una factura disparada en servicios esenciales afecta la vida diaria. Hay entes de control específicos para esto.',
    previoDiagnostico: 'Los servicios públicos tienen marcos regulatorios especiales. Acá están las vías disponibles:',
  },
  turismo_aereo: {
    apertura: 'Un vuelo cancelado, equipaje perdido o un paquete turístico mal prestado te rompe la planificación. El consumidor aéreo tiene protecciones específicas.',
    previoDiagnostico: 'El transporte aéreo y los servicios turísticos tienen reglas propias. Te paso el panorama de opciones:',
  },
  otros_consumo: {
    apertura: 'Cada relación de consumo está cubierta por la Ley 24.240 aunque la empresa no sea de las típicas. Vamos a ordenarlo.',
    previoDiagnostico: 'Aunque el rubro no sea de los más habituales, el marco de defensa del consumidor te protege. Acá están las vías generales:',
  },
};

const EMPATIA_EN: Record<AreaKey, EmpatiaSet> = {
  telecomunicaciones: {
    apertura: 'Telecom issues are among the most common consumer complaints. Let\'s sort this out step by step.',
    previoDiagnostico: 'Fighting with a phone or internet company is exhausting. Here are your options, laid out clearly:',
  },
  financiero: {
    apertura: 'Unrecognized charges or banking problems are some of the clearest cases for filing a complaint. Let\'s go through it together.',
    previoDiagnostico: 'When an unexpected transaction or wrongly reported debt appears, understanding your tools is the first step. Here they are:',
  },
  electrodomesticos: {
    apertura: 'When a warranty isn\'t honored, it feels like you paid for nothing. The law supports you on several points — let\'s look at them.',
    previoDiagnostico: 'Legal warranty is a consumer right, not a favor from the store. Here are the ways to enforce it:',
  },
  ecommerce: {
    apertura: 'You buy online and when there\'s a problem the seller disappears. It\'s frustrating, but there are ways to claim.',
    previoDiagnostico: 'Distance purchases have specific consumer protections. Here are the available paths:',
  },
  seguros_prepaga: {
    apertura: 'When a health plan or insurance denies something you paid for, the stress can be overwhelming. Let\'s look at your options.',
    previoDiagnostico: 'Health plans and insurers are regulated by bodies that can intervene. Here\'s the overview:',
  },
  servicios_publicos: {
    apertura: 'An outage or sky-high bill for essential services affects daily life. There are specific regulatory bodies for this.',
    previoDiagnostico: 'Public utilities have special regulatory frameworks. Here are the available paths:',
  },
  turismo_aereo: {
    apertura: 'A cancelled flight, lost luggage, or a travel package that wasn\'t delivered as promised is incredibly disruptive. Air travelers have specific protections.',
    previoDiagnostico: 'Air transport and travel services have their own rules. Here\'s your overview of options:',
  },
  otros_consumo: {
    apertura: 'Every consumer relationship is covered by consumer protection law, even if the company isn\'t one of the typical ones. Let\'s sort it out.',
    previoDiagnostico: 'Even if the industry is less common, consumer protection law still applies. Here are the general paths:',
  },
};

const EMPATIA_KEYWORD_ES: Array<{ patron: RegExp; frase: string }> = [
  { patron: /\b(bebe|beb[eé]|embaraz|hijo\s+(chico|peque)|anciano|abuelo|discapac)/i,
    frase: 'Entiendo que hay alguien en situación vulnerable en tu caso, eso lo hace prioritario.' },
  { patron: /\b(urgente|ya|inmediato|no\s+puedo\s+esperar)/i,
    frase: 'Veo que necesitás una respuesta rápida.' },
  { patron: /\b(mucha\s+plata|me\s+fund[íi]|mucho\s+dinero|plata\s+que\s+no\s+tengo|lo\s+que\s+ten[íi]a\s+ahorrado)/i,
    frase: 'Entiendo que el monto te está afectando la economía.' },
  { patron: /\b(me\s+enferm[óo]|me\s+hizo\s+mal|salud|tratamiento|medicaci[óo]n)/i,
    frase: 'Cuando además está la salud en el medio, es una situación seria.' },
  { patron: /\b(me\s+enga[ñn]aron|me\s+estafaron|fraude|me\s+mintieron)/i,
    frase: 'Entiendo la sensación de que no actuaron de buena fe.' },
];

const EMPATIA_KEYWORD_EN: Array<{ patron: RegExp; frase: string }> = [
  { patron: /\b(baby|infant|pregnant|child|elderly|grandp|disabled|vulnerable)/i,
    frase: 'I understand there is someone in a vulnerable situation involved — that makes this a priority.' },
  { patron: /\b(urgent|asap|immediately|can't wait|emergency)/i,
    frase: 'I can see you need a quick response.' },
  { patron: /\b(lot of money|all my savings|can't afford|financially|broke)/i,
    frase: 'I understand the amount is affecting your finances.' },
  { patron: /\b(sick|health|treatment|medication|injury)/i,
    frase: 'When health is also involved, this is a serious situation.' },
  { patron: /\b(scam|deceived|fraud|lied|cheated)/i,
    frase: 'I understand the feeling that they did not act in good faith.' },
];

export function getEmpatiaApertura(area: AreaKey | undefined, problemaTexto?: string, locale = 'es'): string {
  const map = locale === 'en' ? EMPATIA_EN : EMPATIA_ES;
  const keywords = locale === 'en' ? EMPATIA_KEYWORD_EN : EMPATIA_KEYWORD_ES;
  const fallback = locale === 'en'
    ? "I understand — let's look at your case step by step."
    : 'Entiendo, vamos a ver tu caso paso a paso.';

  const baseEmpatia = area ? map[area].apertura : fallback;
  if (!problemaTexto) return baseEmpatia;

  const extra = keywords.find(({ patron }) => patron.test(problemaTexto));
  return extra ? `${extra.frase} ${baseEmpatia}` : baseEmpatia;
}

export function getEmpatiaPrevioDiagnostico(area: AreaKey | undefined, locale = 'es'): string {
  const map = locale === 'en' ? EMPATIA_EN : EMPATIA_ES;
  const fallback = locale === 'en'
    ? 'Based on what you told me, here is an overview of your available options:'
    : 'Con lo que me contaste, te paso un panorama de las opciones disponibles:';
  return area ? map[area].previoDiagnostico : fallback;
}
