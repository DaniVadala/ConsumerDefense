'use client';

import { useState } from 'react';
import { MessageCircle, Mail, User, Bot, ArrowRight, CalendarDays } from 'lucide-react';
import { LeadForm } from '../lead-form';
import { useCalModal } from '../cal-modal';
import { useLocale } from '@/lib/i18n/context';
import { trackChatFocus, trackCalModalOpen, trackCalPreload, trackWhatsAppClick, trackEmailClick, trackLeadFormOpen } from '@/lib/analytics';
import { useChatAvailability } from '@/lib/chat-availability-context';
import { openMailCompose } from '@/lib/utils';

const WHATSAPP_NUMBER = '5493515284074';
const CONTACT_EMAIL = 'angelyocca@hotmail.com';

export function InfoSection() {
  const { t } = useLocale();
  const [formOpen, setFormOpen] = useState(false);
  const { openCalModal, preloadCal } = useCalModal();
  const { chatAvailable } = useChatAvailability();

  const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(t.info.waMessage)}`;

  return (
    <section className="pt-6 pb-16 lg:pt-8 lg:pb-20 px-4 bg-white" aria-label="Canales de contacto">
      <div className="max-w-5xl mx-auto">

        {/* Section header */}
        <div
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 bg-gray-100 text-gray-600 text-xs font-semibold px-4 py-2 rounded-full mb-3">
            {t.info.pill}
          </div>
          <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 tracking-tight">
            {t.info.title}
          </h2>
          <p className="text-gray-400 text-sm mt-1.5">
            {t.info.subtitle}
          </p>
        </div>

        {/* ── Primary CTAs ── */}
        <div className={`grid grid-cols-1 gap-4 mb-4 ${chatAvailable ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>

          {/* AI Chat — primary (hidden when service unavailable) */}
          {chatAvailable && <a
            href="#chat"
            onClick={(e) => {
              e.preventDefault();
              trackChatFocus();
              const inputs = document.querySelectorAll<HTMLTextAreaElement>('[data-chat-input]');
              const textarea = Array.from(inputs).find(el => el.offsetParent !== null);
              if (textarea) {
                textarea.focus();
                const rect = textarea.getBoundingClientRect();
                window.scrollTo({ top: Math.max(0, window.scrollY + rect.bottom - window.innerHeight + 20), behavior: 'smooth' });
              } else {
                document.getElementById('chat-widget')?.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            className="group relative flex flex-col p-5 rounded-2xl bg-gradient-to-br from-[var(--accent-9)] to-[var(--teal-9)] text-white shadow-lg shadow-emerald-200/50 hover:shadow-xl hover:shadow-emerald-300/50 hover:scale-[1.02] hover:-translate-y-0.5 transition-all duration-200 cursor-pointer overflow-hidden"
          >
            {/* Subtle pattern */}
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '18px 18px' }} />
            <ArrowRight className="absolute top-4 right-4 w-4 h-4 text-white/40 group-hover:text-white group-hover:translate-x-0.5 transition-all duration-200" />
            <div className="relative flex items-center gap-2 mb-3">
              <p className="font-bold text-base leading-tight">{t.info.aiTitle}</p>
              <span className="text-[9px] font-bold bg-white/25 px-2 py-0.5 rounded-full uppercase tracking-wide flex-shrink-0">
                {t.info.aiBadge}
              </span>
            </div>
            <div className="relative flex items-start gap-3">
              <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0 backdrop-blur-sm group-hover:scale-105 transition-transform duration-200">
                <Bot className="w-5.5 h-5.5 text-white" strokeWidth={1.75} />
              </div>
              <p className="text-sm text-white/75 leading-snug pt-0.5">
                {t.info.aiDesc}
              </p>
            </div>
          </a>}

          {/* Cal.com — Schedule meeting — primary */}
          <button
            onClick={() => { trackCalModalOpen('info'); openCalModal(); }}
            onPointerEnter={() => { trackCalPreload('info'); preloadCal(); }}
            onFocus={() => { trackCalPreload('info'); preloadCal(); }}
            className="group relative flex flex-col p-5 rounded-2xl bg-gradient-to-br from-[var(--accent-9)] to-[var(--teal-9)] text-white shadow-lg shadow-emerald-200/50 hover:shadow-xl hover:shadow-emerald-300/50 hover:scale-[1.02] hover:-translate-y-0.5 transition-all duration-200 cursor-pointer overflow-hidden text-left"
          >
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '18px 18px' }} />
            <ArrowRight className="absolute top-4 right-4 w-4 h-4 text-white/40 group-hover:text-white group-hover:translate-x-0.5 transition-all duration-200" />
            <div className="relative flex items-center gap-2 mb-3">
              <p className="font-bold text-base leading-tight">{t.info.calTitle}</p>
              <span className="text-[9px] font-bold bg-white/25 px-2 py-0.5 rounded-full uppercase tracking-wide flex-shrink-0">
                {t.info.calBadge}
              </span>
            </div>
            <div className="relative flex items-start gap-3">
              <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0 backdrop-blur-sm group-hover:scale-105 transition-transform duration-200">
                <CalendarDays className="w-5.5 h-5.5 text-white" strokeWidth={1.75} />
              </div>
              <p className="text-sm text-white/75 leading-snug pt-0.5">
                {t.info.calDesc}
              </p>
            </div>
          </button>

          {/* WhatsApp — primary */}
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackWhatsAppClick('info')}
            className="group relative flex flex-col p-5 rounded-2xl bg-gradient-to-br from-[#1faf38] to-[#25D366] text-white shadow-lg shadow-green-200/50 hover:shadow-xl hover:shadow-green-300/50 hover:scale-[1.02] hover:-translate-y-0.5 transition-all duration-200 overflow-hidden"
          >
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '18px 18px' }} />
            <ArrowRight className="absolute top-4 right-4 w-4 h-4 text-white/40 group-hover:text-white group-hover:translate-x-0.5 transition-all duration-200" />
            <div className="relative flex items-center gap-2 mb-3">
              <p className="font-bold text-base leading-tight">{t.info.waTitle}</p>
              <span className="text-[9px] font-bold bg-white/25 px-2 py-0.5 rounded-full uppercase tracking-wide flex-shrink-0">
                {t.info.waBadge}
              </span>
            </div>
            <div className="relative flex items-start gap-3">
              <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0 backdrop-blur-sm group-hover:scale-105 transition-transform duration-200">
                <MessageCircle className="w-5.5 h-5.5 text-white fill-white" strokeWidth={1.5} />
              </div>
              <p className="text-sm text-white/75 leading-snug pt-0.5">
                {t.info.waDesc}
              </p>
            </div>
          </a>
        </div>

        {/* ── Secondary options ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

          {/* Email */}
          <button
            onClick={() => { trackEmailClick('info'); openMailCompose(CONTACT_EMAIL, t.info.mailSubject, t.info.mailBody); }}
            className="group flex items-center gap-4 px-5 py-4 bg-white border border-gray-200 rounded-xl shadow-[0_2px_12px_-2px_rgba(0,0,0,0.08)] hover:shadow-[0_6px_20px_-4px_rgba(0,0,0,0.14)] hover:border-gray-300 hover:-translate-y-0.5 transition-all duration-200 w-full text-left cursor-pointer"
          >
            <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-200">
              <Mail className="w-4.5 h-4.5 text-blue-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-gray-800 leading-tight">{t.info.emailTitle}</p>
              <p className="text-xs text-gray-400 leading-snug">{t.info.emailDesc}</p>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-0.5 transition-all duration-200 flex-shrink-0" />
          </button>

          {/* Lead form */}
          <button
            onClick={() => { trackLeadFormOpen('info'); setFormOpen(true); }}
            className="group flex items-center gap-4 px-5 py-4 bg-white border border-gray-200 rounded-xl shadow-[0_2px_12px_-2px_rgba(0,0,0,0.08)] hover:shadow-[0_6px_20px_-4px_rgba(0,0,0,0.14)] hover:border-gray-300 hover:-translate-y-0.5 transition-all duration-200 text-left w-full"
          >
            <div className="w-9 h-9 bg-[var(--accent-3)] rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-200">
              <User className="w-4.5 h-4.5 text-[var(--accent-9)]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-gray-800 leading-tight">{t.info.formTitle}</p>
              <p className="text-xs text-gray-400 leading-snug">{t.info.formDesc}</p>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-0.5 transition-all duration-200 flex-shrink-0" />
          </button>

        </div>
      </div>

      <LeadForm open={formOpen} onOpenChange={setFormOpen} />
    </section>
  );
}
