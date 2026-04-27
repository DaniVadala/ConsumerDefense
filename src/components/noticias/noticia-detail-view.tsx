'use client';

import Link from 'next/link';
import { ArrowLeft, Calendar, ExternalLink } from 'lucide-react';
import { useLocale } from '@/lib/i18n/context';
import type { NoticiaArticle } from '@/lib/noticias/articles';
import { formatNoticiaDate } from '@/lib/noticias/articles';

type Props = {
  article: NoticiaArticle;
};

export function NoticiaDetailView({ article }: Props) {
  const { t } = useLocale();

  return (
    <article className="max-w-2xl mx-auto px-4 py-12 md:py-16">
      <Link
        href="/noticias"
        className="inline-flex items-center gap-2 text-sm font-medium text-[var(--accent-11)] hover:underline mb-8"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        {t.noticias.backToList}
      </Link>

      <div className="mb-6 flex flex-wrap items-center gap-2 text-sm text-gray-500">
        <span className="rounded-full bg-[var(--accent-3)] px-2.5 py-0.5 text-xs font-medium text-[var(--accent-11)]">
          {article.tag}
        </span>
        <span className="inline-flex items-center gap-1">
          <Calendar className="h-4 w-4" aria-hidden />
          <time dateTime={article.date}>{formatNoticiaDate(article.date)}</time>
        </span>
      </div>

      <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900 leading-tight mb-8">
        {article.title}
      </h1>

      <div className="prose prose-gray max-w-none">
        <section className="mb-10">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-3">Resumen del caso</h2>
          <p className="text-lg leading-relaxed text-gray-800">{article.summary}</p>
        </section>

        <section className="rounded-2xl border border-emerald-200/80 bg-emerald-50/60 p-6 md:p-8 mb-10">
          <h2 className="text-lg font-semibold text-emerald-900 mb-3 flex items-center gap-2">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />
            {t.noticias.analysisTitle}
          </h2>
          <p className="text-gray-800 leading-relaxed">{article.analisisDefensaYa}</p>
        </section>

        <p className="text-sm text-gray-500">
          <a
            href={article.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 font-medium text-[var(--accent-11)] hover:underline"
          >
            {t.noticias.sourceCta}
            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
          </a>
        </p>
      </div>
    </article>
  );
}
