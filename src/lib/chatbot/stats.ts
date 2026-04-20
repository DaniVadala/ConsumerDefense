// src/lib/chatbot/stats.ts
/**
 * Estadísticas oficiales argentinas sobre resolución de reclamos de consumo.
 * Se muestran en el diagnóstico como encuadre (no como promesa).
 *
 * IMPORTANTE: todas las cifras tienen FUENTE y AÑO. Si se actualizan,
 * se cambian acá en un solo lugar.
 *
 * Uso ético:
 * - NUNCA se dice "tu caso tiene X% de éxito".
 * - SIEMPRE se dice "en [año] según [fuente], el X% de los casos de [tipo]
 *   llegaron a [resultado]".
 */

import type { AreaKey } from './state';

export interface StatCard {
  /** Frase que se muestra al usuario */
  frase: string;
  /** Fuente citable */
  fuente: string;
  /** Año del dato */
  anio: number;
}

/**
 * Stats genéricas sobre resolución administrativa.
 * Se usan cuando no hay una stat específica del área.
 *
 * Nota: reemplazar los valores exactos con la última publicación oficial
 * antes de producción. Los rangos aquí son conservadores y basados en
 * publicaciones abiertas de la DNDC y la Secretaría de Comercio.
 */
const STATS_GENERICAS: StatCard[] = [
  {
    frase: 'Una parte significativa de los reclamos formales de consumo en Argentina se resuelve en la instancia administrativa o conciliatoria, sin llegar a juicio.',
    fuente: 'Dirección Nacional de Defensa del Consumidor',
    anio: 2024,
  },
  {
    frase: 'El sistema COPREC (Conciliación Previa) suele resolver muchos casos en pocas audiencias y sin costo para el consumidor.',
    fuente: 'Ley 26.993 / Secretaría de Comercio',
    anio: 2024,
  },
];

/**
 * Stats por área. Las frases son enmarcables, verificables y neutras.
 */
const STATS_POR_AREA: Partial<Record<AreaKey, StatCard[]>> = {
  telecomunicaciones: [
    {
      frase: 'Los reclamos ante ENACOM cuentan con procedimiento específico y plazos regulados.',
      fuente: 'Resolución ENACOM / Ley 27.078',
      anio: 2024,
    },
  ],
  financiero: [
    {
      frase: 'El BCRA exige a bancos y tarjetas responder reclamos en plazos regulados y cuenta con un área de Protección al Usuario Financiero.',
      fuente: 'Comunicación "A" BCRA / Ley 25.065',
      anio: 2024,
    },
  ],
  electrodomesticos: [
    {
      frase: 'La Ley 24.240 establece una garantía legal mínima para productos no consumibles que es independiente de la garantía comercial del fabricante.',
      fuente: 'Ley 24.240 arts. 11-18',
      anio: 1993,
    },
  ],
  ecommerce: [
    {
      frase: 'En compras a distancia, la Ley 24.240 prevé un derecho de revocación para el consumidor dentro de un plazo determinado.',
      fuente: 'Ley 24.240 art. 34',
      anio: 1993,
    },
  ],
  seguros_prepaga: [
    {
      frase: 'La Superintendencia de Servicios de Salud interviene en reclamos contra prepagas y obras sociales con procedimientos específicos.',
      fuente: 'Ley 26.682 / Superintendencia de Servicios de Salud',
      anio: 2024,
    },
  ],
  servicios_publicos: [
    {
      frase: 'ENRE, ENARGAS y las autoridades provinciales tienen procedimientos de reclamo con plazos de respuesta regulados por el marco de cada servicio.',
      fuente: 'Marcos regulatorios ENRE / ENARGAS',
      anio: 2024,
    },
  ],
  turismo_aereo: [
    {
      frase: 'La ANAC y la normativa de transporte aéreo prevén compensaciones e indemnizaciones tarifadas en casos de cancelaciones, demoras y equipaje, sujetas a condiciones.',
      fuente: 'Código Aeronáutico / Resolución 1532/98',
      anio: 2024,
    },
  ],
};

/**
 * Stat específica de Córdoba si el usuario está en la provincia.
 */
const STAT_CORDOBA: StatCard = {
  frase: 'En Córdoba podés reclamar en la Dirección de Defensa del Consumidor de la Provincia (Ley 10.247) o en la OMIC municipal, además de la vía nacional.',
  fuente: 'Ley Provincial 10.247 / Municipalidad de Córdoba',
  anio: 2024,
};

export function getStatsParaDiagnostico(area: AreaKey | undefined, esCordoba = true): StatCard[] {
  const stats: StatCard[] = [];
  if (area && STATS_POR_AREA[area]) {
    stats.push(...STATS_POR_AREA[area]!);
  } else {
    stats.push(STATS_GENERICAS[0]);
  }
  if (esCordoba) stats.push(STAT_CORDOBA);
  return stats.slice(0, 2); // máximo 2 para no saturar
}

export function statsToText(stats: StatCard[]): string {
  if (stats.length === 0) return '';
  return stats
    .map((s) => `• ${s.frase} (${s.fuente}, ${s.anio})`)
    .join('\n');
}
