import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { NoticiaDetailView } from '@/components/noticias/noticia-detail-view';
import { getNoticiaBySlug, NOTICIAS } from '@/lib/noticias/articles';

const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://defensaya.com';

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return NOTICIAS.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const article = getNoticiaBySlug(slug);
  if (!article) {
    return { title: 'Noticia no encontrada — DefensaYa' };
  }
  const title = `${article.title} — DefensaYa`;
  const description = article.summary.slice(0, 160);
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `/noticias/${article.slug}`,
      type: 'article',
      publishedTime: article.date,
    },
    alternates: {
      canonical: `/noticias/${article.slug}`,
    },
  };
}

export default async function NoticiaPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const article = getNoticiaBySlug(slug);
  if (!article) notFound();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'NewsArticle',
            headline: article.title,
            datePublished: article.date,
            description: article.summary,
            url: `${BASE}/noticias/${article.slug}`,
            author: { '@type': 'Organization', name: 'DefensaYa' },
            publisher: { '@type': 'Organization', name: 'DefensaYa' },
          }),
        }}
      />
      <NoticiaDetailView article={article} />
    </>
  );
}
