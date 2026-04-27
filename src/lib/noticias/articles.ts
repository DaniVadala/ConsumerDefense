/**
 * Contenido editorial de Noticias y fallos (DefensaYa).
 * Las fuentes son notas de prensa; el análisis es opinión de la plataforma.
 */

export type NoticiaArticle = {
  slug: string;
  /** ISO date string for display and sorting */
  date: string;
  tag: string;
  title: string;
  summary: string;
  /** Opinión / análisis (branded) */
  analisisDefensaYa: string;
  sourceUrl: string;
};

export const NOTICIAS: NoticiaArticle[] = [
  {
    slug: 'banco-fallo-seguridad-phishing-mar-del-plata',
    date: '2026-04-19',
    tag: 'Banca y ciberfraude',
    title: 'Un fallo de Mar del Plata redefinió el estándar de seguridad bancaria frente al phishing',
    summary:
      'La Justicia condenó a un banco a abonar más de 26 millones de pesos a una clienta que fue víctima de un fraude por correo falso. El juez entendió que la entidad incumplió su deber de seguridad al no detener operaciones atípicas —entre ellas, transferencias asociadas a conexiones desde el extranjero— y sentó un precedente exigente sobre el blindaje digital de las cuentas.',
    analisisDefensaYa:
      'Desde DefensaYa vemos en este fallo un giro hacia la responsabilidad objetiva de los bancos por el canal digital: no basta ofrecer “home banking”; hace falta orquestar alertas, límites y bloqueos ante conductas inusuales con la misma diligencia con la que se promete conveniencia. Para el consumidor, el mensaje es claro: la protección ya no puede quedar solo del lado de la clave o del antivirus — las entidades deben asumir el costo de fricciones (validaciones, geolocalización, doble factor) que eviten el vaciado de cuentas. La tecnología legal se cruza con la ciberseguridad: plataformas como la nuestra existen justamente para mapear rápido qué exigir y cómo documentar un reclamo cuando el banco no cumple con ese deber reforzado de seguridad.',
    sourceUrl:
      'https://www.infobae.com/judiciales/2026/04/19/le-vaciaron-las-cuentas-con-un-mail-falso-demando-al-banco-y-la-justicia-ordeno-que-le-paguen-siete-veces-lo-que-le-robaron/',
  },
  {
    slug: 'planes-ahorro-rescision-condiciones-ocultas',
    date: '2026-04-10',
    tag: 'Automotor',
    title: 'Planes de ahorro: la Cámara castigó cuotas “sorpresa” y un adelanto que nunca se informó',
    summary:
      'La Cámara de Apelaciones confirmó la rescisión de un contrato de plan de ahorro y ordenó resarcir al consumidor, con daño moral. La concesionaria había exigido cuotas variables, un adelanto elevado para la entrega del vehículo y otras condiciones que no se habían explicitado al momento de la firma, vulnerando el deber de buena fe y de información clara previsto para relaciones de consumo.',
    analisisDefensaYa:
      'La opacidad en planes de ahorro es un campo fértil para litigios: las variables que impactan en el bolsillo (actualización, ajuste de cuota, requisitos de entrega) deben quedar trazables desde el anuncio, no en cláusulas colapsadas. Este fallo refuerza que la “sorpresa” contractual no se tolera: el consumidor no puede financiar con incertidumbre la compra de un bien de alto valor. Tecnológicamente, nuestro enfoque es alinear el relato del usuario con el esquema de transparencia que la LDC y la jurisprudencia exigen: detectar fácilmente qué oferta era engañosa y qué prueba conviene reunir (contrato, publicidad, comprobantes) antes de un reclamo o mediación.',
    sourceUrl: 'https://www.iprofesional.com/legales/453275-planes-autos-fallo-fulminante-abrio-resarcimientos-millonarios',
  },
  {
    slug: 'ecommerce-orden-difundir-sentencia-canales',
    date: '2026-03-20',
    tag: 'E-commerce y transparencia',
    title: 'Venta online: condena económica y obligación de publicar la propia sentencia en redes',
    summary:
      'Una empresa fue condenada por no ser suficientemente clara con consumidores en canales digitales, en el marco de un reclamo vinculado al deber de información en ventas a distancia. Además de la sanción patrimonial, el tribunal impuso publicar y difundir el fallo en sus plataformas, como medida reparatoria y de advertencia a futuros clientes.',
    analisisDefensaYa:
      'Ordenar que la condena se “haga visible” en los mismos canales donde se captó al usuario combina reparación con prevención masiva: la reputación deja de ser solo un riesgo de marketing y pasa a ser un mecanismo de compliance judicial. En e-commerce, la asimetría informativa se combate con trazas auditables: políticas de devolución, plazos y cargos deben ser verificables, no un laberinto. Para DefensaYa, este precedente subraya por qué documentar la experiencia de compra (capturas, chats, e-mails) es tan relevante: cuando la información es pobre o contradictoria, la prueba digital puede volcar la carga a la empresa, incluso con remedios inusuales como la publicación del fallo en sus perfiles oficiales.',
    sourceUrl:
      'https://www.infobae.com/judiciales/2026/03/20/una-empresa-de-venta-online-fue-condenada-por-ocultar-informacion-y-le-ordenaron-difundir-la-sentencia/',
  },
  {
    slug: 'banco-prohibido-debito-anticipado-tarjeta',
    date: '2026-03-12',
    tag: 'Tarjetas y cobros',
    title: 'La Justicia frenó a un banco que debitaba resúmenes de tarjeta antes del vencimiento',
    summary:
      'En un caso seguido por la prensa especializada, la Justicia cuestionó la práctica de descontar automáticamente el saldo de la tarjeta de crédito en fechas anteriores al vencimiento del resumen, perjudicando la previsibilidad del consumidor. El fallo apuntó a resguardar al usuario frente a cobros apresurados y a reforzar el respeto por las fechas contractuales y regulatorias vinculadas a la deuda con tarjeta.',
    analisisDefensaYa:
      'Los débitos “adelantados” eroden el presupuesto familiar y dificultan el reclamo colectivo porque muchas veces se naturalizan en la app del banco. Un precedente que los limita o los anula reordena la relación: el pago programado no puede convertirse en un retención sorpresiva. En términos de producto y datos, deberíamos exigir a las entidades que cada cargo respete la fecha y el monto informados, con notificaciones comparables a las de una transferencia. Herramientas de análisis prelegal ayudan a cruzar extractos, fechas de vencimiento y comprobantes para detectar con rapidez si hubo un débito fuera de tiempo —un patrón perfectamente automatizable y defendible hoy ante Defensa del Consumidor o vía judicial.',
    sourceUrl:
      'https://www.infobae.com/economia/2026/03/12/la-justicia-fallo-contra-un-banco-por-cobrar-el-resumen-de-la-tarjeta-antes-de-tiempo/',
  },
];

export function getNoticiaBySlug(slug: string): NoticiaArticle | undefined {
  return NOTICIAS.find((a) => a.slug === slug);
}

export function getNoticiasSorted(): NoticiaArticle[] {
  return [...NOTICIAS].sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function formatNoticiaDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(iso + 'T12:00:00'));
  } catch {
    return iso;
  }
}
