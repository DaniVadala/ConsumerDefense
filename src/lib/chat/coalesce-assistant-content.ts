/**
 * En el stream a veces llegan varias partes `text` consecutivas con el mismo
 * string (p. ej. la pregunta de provincia duplicada). Unimos el run de texto
 * y eliminamos repeticiones consecutivas idénticas para una sola burbuja.
 */
export function coalesceConsecutiveTextRuns(
  content: ReadonlyArray<unknown> | undefined,
): unknown[] {
  if (!content?.length) return [];
  const out: unknown[] = [];
  let i = 0;
  while (i < content.length) {
    const p = content[i] as { type?: string; text?: string };
    if (p?.type === 'text' && typeof p.text === 'string') {
      const run: string[] = [];
      let j = i;
      while (j < content.length) {
        const q = content[j] as { type?: string; text?: string };
        if (q?.type === 'text' && typeof q.text === 'string') {
          run.push(q.text);
          j++;
        } else {
          break;
        }
      }
      const dedup: string[] = [];
      for (const t of run) {
        if (dedup.length === 0 || dedup[dedup.length - 1] !== t) {
          dedup.push(t);
        }
      }
      out.push({ type: 'text', text: dedup.join('\n\n') });
      i = j;
    } else {
      out.push(content[i]);
      i++;
    }
  }
  return out;
}
