import type { CSSProperties, ReactNode } from 'react';

export type FormatBoldOptions = {
  /** Clases del `<span` para segmentos en negrita (p. ej. en burbuja del usuario, texto blanco). */
  strongClassName?: string;
  strongStyle?: CSSProperties;
};

const defaultStrong: Required<Pick<FormatBoldOptions, 'strongClassName' | 'strongStyle'>> = {
  strongClassName: 'font-semibold',
  strongStyle: { color: 'var(--slate-12)' },
};

/**
 * Convierte `**así**` en énfasis tipográfico; el resto se muestra literal (con saltos vía pre-wrap en el contenedor).
 */
export function formatBoldSegments(text: string, options?: FormatBoldOptions): ReactNode {
  if (!text.includes('**')) {
    return text;
  }
  const sClass = options?.strongClassName ?? defaultStrong.strongClassName;
  const sStyle = { ...defaultStrong.strongStyle, ...options?.strongStyle };
  const nodes: ReactNode[] = [];
  const re = /\*\*([^*]+)\*\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  // eslint-disable-next-line no-cond-assign
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) {
      nodes.push(text.slice(last, m.index));
    }
    nodes.push(
      <span key={k} className={sClass} style={sStyle}>
        {m[1]}
      </span>,
    );
    k += 1;
    last = m.index + m[0].length;
  }
  if (last < text.length) {
    nodes.push(text.slice(last).replace(/\*\*/g, ''));
  }
  return <>{nodes}</>;
}
