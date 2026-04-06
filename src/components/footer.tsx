'use client';

import { Shield, ExternalLink } from 'lucide-react';
import { useLocale } from '@/lib/i18n/context';

const ORGANISMOS = [
  { label: 'Defensa del Consumidor', href: 'https://www.argentina.gob.ar/produccion/defensadelconsumidor' },
  { label: 'ENACOM', href: 'https://www.enacom.gob.ar' },
  { label: 'ENRE', href: 'https://www.enre.gov.ar' },
  { label: 'ENARGAS', href: 'https://www.enargas.gob.ar' },
  { label: 'Defensoría del Pueblo', href: 'https://www.dpn.gob.ar' },
  { label: 'BCRA', href: 'https://www.bcra.gob.ar' },
];

const LEYES = [
  { label: 'Ley 24.240 – Defensa del Consumidor', href: 'https://servicios.infoleg.gob.ar/infolegInternet/anexos/0-4999/638/texact.htm' },
  { label: 'Ley 25.065 – Tarjetas de Crédito', href: 'https://servicios.infoleg.gob.ar/infolegInternet/anexos/55000-59999/60368/texact.htm' },
  { label: 'Ley 26.993 – Resolución de Conflictos', href: 'https://servicios.infoleg.gob.ar/infolegInternet/anexos/230000-234999/233961/norma.htm' },
  { label: 'Ley 26.994 – Cód. Civil y Comercial', href: 'https://servicios.infoleg.gob.ar/infolegInternet/anexos/235000-239999/235975/norma.htm' },
  { label: 'Ley 24.999 – Reform. Def. Consumidor', href: 'https://servicios.infoleg.gob.ar/infolegInternet/anexos/45000-49999/48872/norma.htm' },
];

function FooterLinkList({ items }: { items: { label: string; href: string }[] }) {
  return (
    <ul className="space-y-2.5">
      {items.map((item) => (
        <li key={item.href}>
          <a
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-start gap-1.5 text-sm text-gray-400 hover:text-white transition-colors leading-snug"
          >
            <span>{item.label}</span>
            <ExternalLink className="w-3 h-3 mt-0.5 flex-shrink-0 opacity-0 group-hover:opacity-60 transition-opacity" />
          </a>
        </li>
      ))}
    </ul>
  );
}

function FooterHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-4">
      {children}
    </h3>
  );
}

export function Footer() {
  const { t } = useLocale();
  const legalLinks = [
    { label: t.footer.privacyPolicy, href: '#' },
    { label: t.footer.termsOfUse, href: '#' },
    { label: t.footer.legalNotice, href: '#' },
  ];
  return (
    <footer className="bg-gray-900 text-white" aria-label="Pie de página">
      <div className="max-w-6xl mx-auto px-6 pt-14 pb-8">

        {/* ── Main grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10 mb-12">

          {/* Brand column — spans full width on mobile, 1 col on md+ */}
          <div className="sm:col-span-2 md:col-span-1">
            <a
              href="#"
              className="inline-flex items-center gap-2.5 mb-4 hover:opacity-80 transition-opacity"
              aria-label="DefensaYa – inicio"
            >
              <div className="w-9 h-9 bg-gradient-to-br from-[var(--accent-9)] to-[var(--teal-9)] rounded-lg flex items-center justify-center shadow-md flex-shrink-0">
                <Shield className="w-4.5 h-4.5 text-white" />
              </div>
              <span className="text-lg font-bold tracking-tight">DefensaYa</span>
            </a>
            <p className="text-sm text-gray-400 leading-relaxed max-w-xs">
              {t.footer.tagline}
            </p>
          </div>

          {/* Organismos column */}
          <div>
            <FooterHeading>{t.footer.orgsHeading}</FooterHeading>
            <FooterLinkList items={ORGANISMOS} />
          </div>

          {/* Leyes column */}
          <div>
            <FooterHeading>{t.footer.legalHeading}</FooterHeading>
            <FooterLinkList items={LEYES} />
          </div>

          {/* Legal links column */}
          <div>
            <FooterHeading>{t.footer.legalLinksHeading}</FooterHeading>
            <ul className="space-y-2.5">
              {legalLinks.map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── Divider + bottom bar ── */}
        <div className="border-t border-gray-800 pt-6 space-y-4">
          <p className="text-xs text-gray-500 leading-relaxed">
            <strong className="text-gray-400 font-semibold">{t.footer.disclaimerLabel}</strong>{' '}
            {t.footer.disclaimerText}
          </p>
          <p className="text-xs text-gray-600 text-center md:text-right">
            © {new Date().getFullYear()} DefensaYa · {t.footer.copyright}
          </p>
        </div>

      </div>
    </footer>
  );
}
