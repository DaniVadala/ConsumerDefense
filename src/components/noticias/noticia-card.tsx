import Link from 'next/link';
import { ArrowRight, Calendar } from 'lucide-react';
import { formatNoticiaDate, type NoticiaArticle } from '@/lib/noticias/articles';

type Props = {
  article: NoticiaArticle;
  readLabel: string;
};

export function NoticiaCard({ article, readLabel }: Props) {
  return (
    <article className="group rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm transition-all hover:border-[var(--accent-7)] hover:shadow-md">
      <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-gray-500">
        <span className="rounded-full bg-[var(--accent-3)] px-2.5 py-0.5 font-medium text-[var(--accent-11)]">
          {article.tag}
        </span>
        <span className="inline-flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5" aria-hidden />
          <time dateTime={article.date}>{formatNoticiaDate(article.date)}</time>
        </span>
      </div>
      <h2 className="mb-2 text-lg font-semibold leading-snug tracking-tight text-gray-900 group-hover:text-[var(--accent-11)] transition-colors">
        <Link href={`/noticias/${article.slug}`} className="focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-9)] focus-visible:ring-offset-2 rounded">
          {article.title}
        </Link>
      </h2>
      <p className="text-sm leading-relaxed text-gray-600 line-clamp-3">{article.summary}</p>
      <Link
        href={`/noticias/${article.slug}`}
        className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--accent-11)] hover:underline"
      >
        {readLabel}
        <ArrowRight className="h-4 w-4" aria-hidden />
      </Link>
    </article>
  );
}
