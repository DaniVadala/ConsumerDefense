import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Theme } from "@radix-ui/themes";
import { LocaleProvider } from "@/lib/i18n/context";
import "@radix-ui/themes/styles.css";
import "flag-icons/css/flag-icons.min.css";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: '¿Tenés un reclamo viable como consumidor? — DefensaYa',
  description:
    '¿Te cobraron de más? ¿No te responden? DefensaYa te ayuda a entender tus derechos como consumidor argentino. Diagnóstico gratuito con IA.',
  keywords: [
    'reclamo consumidor',
    'defensa del consumidor',
    'cobro indebido',
    'derechos del consumidor',
    'DefensaYa',
  ],
  openGraph: {
    title: '¿Tenés un reclamo viable como consumidor? — DefensaYa',
    description:
      'Orientación gratuita al consumidor argentino. Diagnóstico inmediato con IA.',
    type: 'website',
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
      <body>
        <Theme accentColor="green" grayColor="slate" radius="medium" scaling="100%">
          <LocaleProvider>
            {children}
          </LocaleProvider>
        </Theme>
      </body>
    </html>
  );
}
