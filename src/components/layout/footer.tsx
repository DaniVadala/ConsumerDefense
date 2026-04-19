'use client';

import { useState } from 'react';
import { Shield, ExternalLink, MessageCircle, Mail, Bot, ClipboardList, CalendarDays } from 'lucide-react';
import { useLocale } from '@/lib/i18n/context';
import { useCalModal } from '../cal-modal';
import { LeadForm } from '../lead-form';
import { trackChatFocus, trackWhatsAppClick, trackEmailClick, trackLeadFormOpen, trackCalModalOpen, trackCalPreload, trackExternalLinkClick } from '@/lib/analytics';
import { useChatAvailability } from '@/lib/chat-availability-context';
import { openMailCompose } from '@/lib/utils';


const WHATSAPP_NUMBER = '5493515284074';
const CONTACT_EMAIL = 'angelyocca@hotmail.com';

function focusChatInput() {
  const inputs = document.querySelectorAll<HTMLTextAreaElement>('[data-chat-input]');
  const textarea = Array.from(inputs).find(el => el.offsetParent !== null);
  if (textarea) {
    textarea.focus();
    const rect = textarea.getBoundingClientRect();
    window.scrollTo({ top: Math.max(0, window.scrollY + rect.bottom - window.innerHeight + 20), behavior: 'smooth' });
  }
}

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
            onClick={() => trackExternalLinkClick(item.href, item.label)}
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
  const [formOpen, setFormOpen] = useState(false);
  const { openCalModal, preloadCal } = useCalModal();
  const { chatAvailable } = useChatAvailability();

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

          {/* Contact / CTA column */}
          <div>
            <FooterHeading>{t.footer.contactHeading}</FooterHeading>
            <ul className="space-y-3">
              {chatAvailable && (
              <li>
                <button
                  onClick={() => { trackChatFocus(); focusChatInput(); }}
                  className="group inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                  <Bot className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  {t.footer.contactChat}
                </button>
              </li>
              )}
              <li>
                <a
                  href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(t.footer.contactWaText)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackWhatsAppClick('footer')}
                  className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
                >
                  <MessageCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  {t.footer.contactWa}
                </a>
              </li>
              <li>
                <button
                  onClick={() => { trackEmailClick('footer'); openMailCompose(CONTACT_EMAIL, t.footer.contactMailSubject, t.footer.contactMailBody); }}
                  className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                  <Mail className="w-4 h-4 text-sky-500 flex-shrink-0" />
                  {t.footer.contactMail}
                </button>
              </li>
              <li>
                <button
                  onClick={() => { trackLeadFormOpen('footer'); setFormOpen(true); }}
                  className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                  <ClipboardList className="w-4 h-4 text-violet-400 flex-shrink-0" />
                  {t.footer.contactForm}
                </button>
              </li>
              <li>
                <button
                  onClick={() => { trackCalModalOpen('footer'); openCalModal(); }}
                  onPointerEnter={() => { trackCalPreload('footer'); preloadCal(); }}
                  onFocus={() => { trackCalPreload('footer'); preloadCal(); }}
                  className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                  <CalendarDays className="w-4 h-4 text-teal-400 flex-shrink-0" />
                  {t.footer.contactCal}
                </button>
              </li>
            </ul>
          </div>

          <LeadForm open={formOpen} onOpenChange={setFormOpen} />
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
