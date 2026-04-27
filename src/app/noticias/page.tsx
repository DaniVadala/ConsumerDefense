import type { Metadata } from 'next';
import { NoticiasFeed } from '@/components/noticias/noticias-feed';
import { getNoticiasSorted } from '@/lib/noticias/articles';

export const metadata: Metadata = {
  title: 'Noticias y fallos — DefensaYa',
  description:
    'Fallos y tendencias en defensa del consumidor en Argentina. Resúmenes y análisis de DefensaYa.',
  openGraph: {
    title: 'Noticias y fallos — DefensaYa',
    description:
      'Jurisprudencia reciente sobre defensa del consumidor, con análisis breve de DefensaYa.',
    url: '/noticias',
  },
  alternates: {
    canonical: '/noticias',
  },
};

export default function NoticiasPage() {
  return <NoticiasFeed articles={getNoticiasSorted()} />;
}
