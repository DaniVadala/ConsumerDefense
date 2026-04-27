'use client';

import { NoticiaCard } from '@/components/noticias/noticia-card';
import { useLocale } from '@/lib/i18n/context';
import type { NoticiaArticle } from '@/lib/noticias/articles';

type Props = {
  articles: NoticiaArticle[];
};

export function NoticiasFeed({ articles }: Props) {
  const { t } = useLocale();

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 md:py-16">
      <header className="mb-10 md:mb-12 text-center md:text-left">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900 mb-3">
          {t.noticias.pageTitle}
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl leading-relaxed">{t.noticias.pageSubtitle}</p>
      </header>
      <ul className="space-y-6" aria-label="Listado de notas">
        {articles.map((article) => (
          <li key={article.slug}>
            <NoticiaCard article={article} readLabel={t.noticias.readArticle} />
          </li>
        ))}
      </ul>
    </div>
  );
}
