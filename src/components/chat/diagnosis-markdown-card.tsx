'use client';

import { ClipboardList, Sparkles } from 'lucide-react';
import type { Components } from 'react-markdown';
import ReactMarkdown from 'react-markdown';

/**
 * Heurística: el diagnóstico final del MD siempre contiene el título de sección
 * "Análisis Preliminar de tu Caso" (a veces con emoji 📋).
 */
export function isDiagnosisMarkdownContent(text: string): boolean {
  if (text.length < 24) return false;
  if (/##\s*📋?\s*Análisis Preliminar de tu Caso/i.test(text)) return true;
  if (text.includes('Análisis Preliminar de tu Caso') && text.includes('##')) return true;
  return false;
}

const mdComponents: Components = {
  h1: ({ children }) => (
    <h1 className="text-xl sm:text-lg font-bold tracking-tight text-slate-12 mb-3 mt-0 first:mt-0" style={{ color: 'var(--slate-12)' }}>
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2
      className="text-lg sm:text-base font-bold tracking-tight mt-6 mb-2 pb-2 border-b first:mt-0 flex flex-wrap items-center gap-2"
      style={{ borderColor: 'var(--green-4)', color: 'var(--slate-12)' }}
    >
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3
      className="text-base sm:text-sm font-semibold mt-5 mb-2 flex flex-wrap items-center gap-1.5"
      style={{ color: 'var(--slate-12)' }}
    >
      {children}
    </h3>
  ),
  p: ({ children }) => (
    <p className="text-base sm:text-sm leading-relaxed mb-3 last:mb-0" style={{ color: 'var(--slate-12)' }}>
      {children}
    </p>
  ),
  hr: () => (
    <div className="my-5 h-px w-full bg-gradient-to-r from-transparent via-slate-200 to-transparent" aria-hidden="true" />
  ),
  ul: ({ children }) => (
    <ul className="my-2 ml-0 list-none space-y-2 pl-0 not-prose" style={{ color: 'var(--slate-12)' }}>
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="my-2 ml-4 list-decimal space-y-2 pl-1 text-base sm:text-sm marker:font-medium" style={{ color: 'var(--slate-12)' }}>
      {children}
    </ol>
  ),
  li: ({ children }) => (
    <li
      className="text-base sm:text-sm leading-relaxed pl-2 border-l-2 -ml-0.5"
      style={{ borderColor: 'var(--green-4)' }}
    >
      {children}
    </li>
  ),
  strong: ({ children }) => <strong className="font-semibold" style={{ color: 'var(--slate-12)' }}>{children}</strong>,
  em: ({ children }) => (
    <em className="italic text-base sm:text-sm leading-relaxed" style={{ color: 'var(--slate-11)' }}>
      {children}
    </em>
  ),
  blockquote: ({ children }) => (
    <blockquote
      className="my-3 border-l-4 pl-3 py-1 text-sm sm:text-[13px] rounded-r-md"
      style={{ borderColor: 'var(--accent-9)', background: 'var(--slate-2)' }}
    >
      {children}
    </blockquote>
  ),
  a: ({ href, children }) => (
    <a href={href} className="font-medium underline underline-offset-2" style={{ color: 'var(--accent-11)' }} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  ),
  code: ({ className, children, ...props }) => {
    const isBlock = className?.includes('language-');
    if (isBlock) {
      return (
        <code className="block text-sm sm:text-xs p-3 rounded-lg my-2 overflow-x-auto" style={{ background: 'var(--slate-2)' }} {...props}>
          {children}
        </code>
      );
    }
    return (
      <code className="text-sm sm:text-xs font-mono px-1.5 py-0.5 rounded" style={{ background: 'var(--slate-2)' }} {...props}>
        {children}
      </code>
    );
  },
};

type Props = {
  markdown: string;
  className?: string;
};

/**
 * Presentación tipo “card” del diagnóstico largo (markdown del asistente).
 */
export function DiagnosisMarkdownCard({ markdown, className = '' }: Props) {
  return (
    <article
      className={`w-full max-w-[min(100%,40rem)] min-w-0 ${className}`}
      aria-label="Análisis preliminar del caso"
    >
      <div
        className="group relative rounded-2xl border overflow-hidden"
        style={{
          borderColor: 'rgba(16, 185, 129, 0.22)',
          boxShadow: `
            0 2px 4px -1px rgba(0,0,0,0.04),
            0 8px 24px -6px rgba(16, 185, 129, 0.14),
            0 0 0 1px rgba(255,255,255,0.8) inset
          `,
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.35]"
          style={{
            background: `
              radial-gradient(800px 200px at 0% 0%, rgba(16, 185, 129, 0.12), transparent 50%),
              radial-gradient(600px 180px at 100% 0%, rgba(20, 184, 166, 0.1), transparent 45%)
            `,
          }}
        />
        <div
          className="relative h-1 w-full"
          style={{
            background: 'linear-gradient(90deg, #059669 0%, #14b8a6 42%, #34d399 100%)',
          }}
        />
        <div
          className="relative flex items-start gap-3 px-3 pt-3 pb-2 sm:px-5 sm:pt-4 sm:pb-2 border-b"
          style={{ borderColor: 'rgba(16, 185, 129, 0.12)', background: 'linear-gradient(180deg, #f8fdfb 0%, #f1f5f3 100%)' }}
        >
          <div
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-white shadow-md"
            style={{
              background: 'linear-gradient(145deg, #059669, #0d9488)',
              boxShadow: '0 2px 8px rgba(5, 150, 105, 0.35)',
            }}
          >
            <ClipboardList className="h-5 w-5" aria-hidden />
          </div>
          <div className="min-w-0 pt-0.5">
            <p className="flex items-center gap-1.5 text-xs sm:text-[11px] font-semibold uppercase tracking-wide text-emerald-900/90">
              <Sparkles className="h-3.5 w-3.5 text-emerald-600 opacity-80" aria-hidden />
              Análisis preliminar
            </p>
            <p className="text-xs sm:text-[11px] leading-snug text-slate-500 mt-0.5 max-w-prose">
              Orientativo · no reemplaza consulta con abogado
            </p>
          </div>
        </div>
        <div
          className="relative px-3 py-3 sm:px-5 sm:py-4 rounded-b-2xl border-t border-emerald-100/60"
          style={{
            background: `
              linear-gradient(165deg, rgba(236, 253, 245, 0.97) 0%, rgba(240, 253, 250, 0.88) 35%, rgba(241, 245, 249, 0.75) 100%)
            `,
          }}
        >
          <div
            className="text-base sm:text-sm rounded-xl px-2 py-2 sm:px-3 sm:py-3 [&_h2:first-of-type]:text-[1.3rem] sm:[&_h2:first-of-type]:text-[1.2rem] [&_h2:first-of-type]:mt-0 [&_h2:first-of-type]:pt-0 [&_h2:first-of-type]:pb-3 [&_h2]:scroll-mt-4"
            style={{
              background: 'rgba(255, 255, 255, 0.55)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.9)',
            }}
          >
            <ReactMarkdown components={mdComponents}>{markdown}</ReactMarkdown>
          </div>
        </div>
      </div>
    </article>
  );
}
