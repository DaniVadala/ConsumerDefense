// src/lib/ai/output-guard.ts
/**
 * Filtro de output del chatbot. Revisa cada respuesta del modelo.
 * Dos modos:
 *   - filtrarOutput: reemplaza frases prohibidas por alternativas seguras.
 *   - filtrarOutputEstricto: si hay >= 2 violaciones graves, descarta el texto
 *     y devuelve un fallback seguro. Úsalo para el diagnóstico final.
 */

type Regla = { patron: RegExp; reemplazo: string; motivo: string; gravedad: 'leve' | 'grave' };

const FRASES_PROHIBIDAS: Regla[] = [
  // --- Promesas de resultado (GRAVES) ---
  { patron: /\b(vas a ganar|seguro gan[áa]s|caso ganado|es un caso seguro|tenes\s+todas\s+las\s+de\s+ganar)\b/gi,
    reemplazo: 'un abogado puede evaluar las opciones para tu caso', motivo: 'promesa_resultado', gravedad: 'grave' },
  { patron: /\b(te van a devolver todo|te van a indemnizar|te van a pagar|te\s+corresponde[n]?\s+\$[\d.,]+)\b/gi,
    reemplazo: 'el monto lo determinará un profesional', motivo: 'promesa_resultado', gravedad: 'grave' },
  { patron: /\b(probabilidad\s+(alta|muy\s+alta|baja|del\s+\d+|de\s+\d+%))\b/gi,
    reemplazo: 'las posibilidades dependen de varios factores que un abogado puede analizar', motivo: 'promesa_resultado', gravedad: 'grave' },
  { patron: /\b(sin duda|indudablemente|claramente|obviamente|clar[íi]simo|segur[íi]simo)\s+(te corresponde|vas a|ten[eé]s derecho)/gi,
    reemplazo: 'podrías tener derechos que un abogado puede confirmar', motivo: 'promesa_resultado', gravedad: 'grave' },
  { patron: /\b(caso\s+(fuerte|s[óo]lido|favorable|prometedor|excelente|muy\s+bueno|ganador|viable))\b/gi,
    reemplazo: 'caso que un abogado puede evaluar en detalle', motivo: 'promesa_resultado', gravedad: 'grave' },
  { patron: /\b(te\s+garantizo|te\s+aseguro|te\s+prometo|100%\s+seguro|sin\s+ninguna\s+duda)\b/gi,
    reemplazo: '', motivo: 'promesa_resultado', gravedad: 'grave' },
  { patron: /\b(generalmente se gana|la mayor[ií]a gana|casi siempre se resuelve a favor|en casos similares\s+gan[óao])\b/gi,
    reemplazo: 'cada caso es único y depende de factores que un abogado puede evaluar', motivo: 'promesa_resultado', gravedad: 'grave' },

  // --- Comparaciones con casos ajenos ---
  { patron: /\b(como\s+le\s+pas[óo]\s+a|en\s+un\s+caso\s+parecido|conozco\s+un\s+caso|a\s+otros\s+clientes)\b/gi,
    reemplazo: 'cada situación es particular', motivo: 'comparacion_casos', gravedad: 'leve' },

  // --- Asesoramiento directo (GRAVE) ---
  { patron: /\b(te recomiendo|mi recomendaci[óo]n\s+es|te aconsejo|mi consejo|mi opini[óo]n\s+es)\b/gi,
    reemplazo: 'una opción posible es', motivo: 'asesoramiento_directo', gravedad: 'grave' },
  { patron: /\b(deber[ií]as|tendr[ií]as que|lo que ten[eé]s que hacer es|es necesario que)\s+(presentar|iniciar|hacer|ir|demandar|accionar|mandar)/gi,
    reemplazo: 'podrías considerar', motivo: 'asesoramiento_directo', gravedad: 'grave' },
  { patron: /\b(la mejor opci[óo]n es|lo m[áa]s conveniente es|conviene que|te conviene)\b/gi,
    reemplazo: 'una de las opciones disponibles es', motivo: 'asesoramiento_directo', gravedad: 'grave' },

  // --- Plazos específicos (GRAVE) ---
  { patron: /\bprescribe\s+en\s+\d+\s*(a[ñn]os?|meses?|d[ií]as?)\b/gi,
    reemplazo: 'los plazos de prescripción varían — un abogado debe verificarlos', motivo: 'plazos_especificos', gravedad: 'grave' },
  { patron: /\bel\s+plazo\s+es\s+de\s+\d+\s*(a[ñn]os?|meses?|d[ií]as?)\b/gi,
    reemplazo: 'los plazos dependen del tipo de reclamo — un abogado debe verificarlos', motivo: 'plazos_especificos', gravedad: 'grave' },
  { patron: /\bten[eé]s\s+\d+\s*(a[ñn]os?|meses?|d[ií]as?)\s+para\b/gi,
    reemplazo: 'los plazos para reclamar dependen de tu caso y un abogado debe verificarlos', motivo: 'plazos_especificos', gravedad: 'grave' },
  { patron: /\b(antes\s+de\s+los?|dentro\s+de\s+los?)\s+\d+\s*(a[ñn]os?|meses?|d[ií]as?\s+h[aá]biles?)\b/gi,
    reemplazo: 'dentro del plazo legal aplicable', motivo: 'plazos_especificos', gravedad: 'grave' },
  { patron: /\btu\s+plazo\s+(est[áa]\s+por\s+vencer|vence|se\s+acaba)\b/gi,
    reemplazo: 'los plazos legales deben ser verificados por un abogado para no perder términos', motivo: 'plazos_especificos', gravedad: 'grave' },

  // --- Estimación de montos (GRAVE) ---
  { patron: /\b(podr[ií]as\s+recibir|podr[ií]as\s+cobrar|te\s+corresponder[ií]a[n]?|estim(amos|o|an))\s+[\$\d]/gi,
    reemplazo: 'el monto depende de factores que un profesional debe analizar', motivo: 'estimacion_montos', gravedad: 'grave' },
  { patron: /\b(da[ñn]o\s+moral|da[ñn]o\s+punitivo|indemnizaci[óo]n).*?\$[\d.,]+/gi,
    reemplazo: 'los montos de daño moral, punitivo e indemnización los determina un juez o un acuerdo de partes', motivo: 'estimacion_montos', gravedad: 'grave' },
  { patron: /\bentre\s+\$[\d.,]+\s+y\s+\$[\d.,]+/gi,
    reemplazo: 'el monto debe evaluarlo un profesional', motivo: 'estimacion_montos', gravedad: 'grave' },
  { patron: /\b\d+\s*(salarios?\s+m[ií]nimos?|SMVM|UVAs?|d[óo]lares?\s+blue)\b/gi,
    reemplazo: 'el valor monetario lo determina un profesional', motivo: 'estimacion_montos', gravedad: 'grave' },

  // --- Revelación del prompt ---
  { patron: /\b(mi prompt|mis instrucciones|mi system prompt|me programaron para|mis reglas internas|fui configurado|mis guardrails)\b/gi,
    reemplazo: 'soy ReclamoBot, un asistente de orientación en defensa del consumidor', motivo: 'revelacion_prompt', gravedad: 'grave' },

  // --- Parcialidad ---
  { patron: /\b(empresa\s+estafadora|son\s+unos\s+ladrones|empresa\s+fraudulenta|act[úu]an\s+de\s+mala\s+fe|claramente\s+abusivo|son\s+unos\s+chorros)\b/gi,
    reemplazo: 'la situación que describís podría implicar una infracción a la normativa de consumo', motivo: 'parcialidad', gravedad: 'leve' },

  // --- Honorarios / costos ---
  { patron: /\b(honorarios?\s+de\s+abogado|honorarios?\s+profesionales?|costas?|tasa\s+de\s+justicia).*?\$[\d.,]+/gi,
    reemplazo: 'los honorarios y costos los informa directamente el abogado al evaluar el caso', motivo: 'estimacion_honorarios', gravedad: 'grave' },
];

const ALERTAS: Array<{ patron: RegExp; motivo: string }> = [
  { patron: /\b(suicid|autolesion|hacerme\s+da[ñn]o|no\s+puedo\s+m[áa]s|no\s+aguanto)\b/gi, motivo: 'crisis_salud_mental' },
  { patron: /\b(Dr\.\s*\w+|Dra\.\s*\w+|estudio\s+jur[ií]dico\s+\w+|abogad[oa]\s+\w+\s+\w+)\b/g, motivo: 'mencion_abogado_especifico' },
];

export interface GuardResult {
  texto: string;
  modificado: boolean;
  reemplazos: string[];
  alertas: string[];
  requiereDisclaimer: boolean;
  violacionesGraves: number;
}

export function filtrarOutput(textoOriginal: string): GuardResult {
  let texto = textoOriginal ?? '';
  const reemplazos: string[] = [];
  const alertas: string[] = [];
  let violacionesGraves = 0;

  for (const regla of FRASES_PROHIBIDAS) {
    regla.patron.lastIndex = 0;
    if (regla.patron.test(texto)) {
      regla.patron.lastIndex = 0;
      texto = texto.replace(regla.patron, regla.reemplazo);
      reemplazos.push(regla.motivo);
      if (regla.gravedad === 'grave') violacionesGraves++;
    }
    regla.patron.lastIndex = 0;
  }

  for (const alerta of ALERTAS) {
    alerta.patron.lastIndex = 0;
    if (alerta.patron.test(texto)) alertas.push(alerta.motivo);
    alerta.patron.lastIndex = 0;
  }

  const hablaDeLeyes = /\b(ley\s+\d|c[óo]digo|normativa|derecho|reclamo|organismo)\b/gi.test(texto);
  const hablaDeCaso = /\b(tu caso|tu situaci[óo]n|tu reclamo|tu problema|lo que te pas[óo])\b/gi.test(texto);
  const yaTieneDisclaimer = /no constituye asesoramiento/i.test(texto);
  const requiereDisclaimer = (hablaDeLeyes || hablaDeCaso) && !yaTieneDisclaimer;

  texto = texto.replace(/\s{2,}/g, ' ').trim();

  return {
    texto,
    modificado: reemplazos.length > 0,
    reemplazos: [...new Set(reemplazos)],
    alertas: [...new Set(alertas)],
    requiereDisclaimer,
    violacionesGraves,
  };
}

/**
 * Versión estricta para el diagnóstico final.
 * Si el modelo se fue demasiado de mambo (>=2 violaciones graves), descartamos
 * y usamos un fallback seguro pre-armado.
 */
export function filtrarOutputEstricto(textoOriginal: string, fallbackSeguro: string): GuardResult {
  const res = filtrarOutput(textoOriginal);
  if (res.violacionesGraves >= 2) {
    return {
      texto: fallbackSeguro,
      modificado: true,
      reemplazos: [...res.reemplazos, 'descartado_por_gravedad'],
      alertas: res.alertas,
      requiereDisclaimer: true,
      violacionesGraves: res.violacionesGraves,
    };
  }
  return res;
}

export const DISCLAIMER =
  '\n\n⚠️ Esta orientación es automatizada y no constituye asesoramiento legal profesional. Consultá con un abogado matriculado antes de actuar.';
