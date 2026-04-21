import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { LocaleProvider } from "@/lib/i18n/context";
import { GoogleAnalytics } from "@/components/analytics/google-analytics";
import { AnalyticsProvider } from "@/components/analytics/analytics-provider";
import "./globals.css";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://defensaya.com';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

// SEO: Complete metadata with canonical, twitter card, and OG tags
export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: '¿Tenés un reclamo viable como consumidor? — DefensaYa',
  description:
    '¿Te cobraron de más? ¿No te responden? DefensaYa te ayuda a hacer valer tus derechos como consumidor argentino. Análisis gratuito con IA.',
  keywords: [
    'reclamo consumidor',
    'defensa del consumidor',
    'cobro indebido',
    'derechos del consumidor',
    'DefensaYa',
  ],
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: '¿Tenés un reclamo viable como consumidor? — DefensaYa',
    description:
      'Orientación gratuita al consumidor argentino. Diagnóstico inmediato con IA.',
    type: 'website',
    url: '/',
    siteName: 'DefensaYa',
  },
  twitter: {
    card: 'summary',
    title: '¿Tenés un reclamo viable como consumidor? — DefensaYa',
    description:
      'Orientación gratuita al consumidor argentino. Diagnóstico inmediato con IA.',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* PERF: dns-prefetch for Cal.com embed loaded on demand */}
        <link rel="dns-prefetch" href="https://app.cal.com" />
        <GoogleAnalytics />
      </head>
      <body>
        {/* SEO: JSON-LD Organization structured data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'DefensaYa',
              url: BASE_URL,
              description:
                'Orientación gratuita al consumidor argentino. Diagnóstico inmediato con IA.',
              sameAs: [],
            }),
          }}
        />
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:bg-white focus:text-emerald-700 focus:px-4 focus:py-2 focus:rounded-lg focus:shadow-lg focus:text-sm focus:font-semibold"
        >
          Ir al contenido principal
        </a>
        <LocaleProvider>
          <AnalyticsProvider />
          {children}
        </LocaleProvider>
      </body>
    </html>
  );
}
