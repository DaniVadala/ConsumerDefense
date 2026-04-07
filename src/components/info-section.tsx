'use client';

import { useState } from 'react';
import { MessageCircle, Mail, User, Bot, ArrowRight } from 'lucide-react';
import { LeadForm } from './lead-form';
import { motion } from 'framer-motion';
import { useLocale } from '@/lib/i18n/context';

const WHATSAPP_NUMBER = '5493512852894';
const CONTACT_EMAIL = 'summalegales@gmail.com';

export function InfoSection() {
  const { t } = useLocale();
  const [formOpen, setFormOpen] = useState(false);

  const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(t.info.waMessage)}`;
  const mailUrl = `https://mail.google.com/mail/?view=cm&to=${CONTACT_EMAIL}&su=${encodeURIComponent(t.info.mailSubject)}&body=${encodeURIComponent(t.info.mailBody)}`;

  return (
    <section className="pt-6 pb-16 lg:pt-8 lg:pb-20 px-4 bg-white" aria-label="Canales de contacto">
      <div className="max-w-4xl mx-auto">

        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] as const }}
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
        </motion.div>

        {/* ── Primary CTAs ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">

          {/* AI Chat — primary */}
          <motion.a
            href="#chat"
            onClick={(e) => {
              e.preventDefault();
              const inputs = document.querySelectorAll<HTMLTextAreaElement>('#chat-input');
              const textarea = Array.from(inputs).find(el => el.offsetParent !== null);
              if (textarea) {
                textarea.focus();
                const rect = textarea.getBoundingClientRect();
                window.scrollTo({ top: Math.max(0, window.scrollY + rect.bottom - window.innerHeight + 20), behavior: 'smooth' });
              } else {
                document.getElementById('chat-widget')?.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] as const, delay: 0 }}
            className="group relative flex items-center gap-5 p-6 rounded-2xl bg-gradient-to-br from-[var(--accent-9)] to-[var(--teal-9)] text-white shadow-lg shadow-emerald-200/50 hover:shadow-xl hover:shadow-emerald-300/50 hover:scale-[1.02] hover:-translate-y-0.5 transition-all duration-200 cursor-pointer overflow-hidden"
          >
            {/* Subtle pattern */}
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '18px 18px' }} />
            <div className="relative w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0 backdrop-blur-sm group-hover:scale-105 transition-transform duration-200">
              <Bot className="w-7 h-7 text-white" strokeWidth={1.75} />
            </div>
            <div className="relative flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="font-bold text-base leading-tight">{t.info.aiTitle}</p>
                <span className="text-[9px] font-bold bg-white/25 px-2 py-0.5 rounded-full uppercase tracking-wide flex-shrink-0">
                  {t.info.aiBadge}
                </span>
              </div>
              <p className="text-sm text-white/75 leading-snug">
                {t.info.aiDesc}
              </p>
            </div>
            <ArrowRight className="relative w-5 h-5 text-white/60 group-hover:text-white group-hover:translate-x-1 transition-all duration-200 flex-shrink-0" />
          </motion.a>

          {/* WhatsApp — primary */}
          <motion.a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] as const, delay: 0.08 }}
            className="group relative flex items-center gap-5 p-6 rounded-2xl bg-gradient-to-br from-[#1faf38] to-[#25D366] text-white shadow-lg shadow-green-200/50 hover:shadow-xl hover:shadow-green-300/50 hover:scale-[1.02] hover:-translate-y-0.5 transition-all duration-200 overflow-hidden"
          >
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '18px 18px' }} />
            <div className="relative w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0 backdrop-blur-sm group-hover:scale-105 transition-transform duration-200">
              <MessageCircle className="w-7 h-7 text-white fill-white" strokeWidth={1.5} />
            </div>
            <div className="relative flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="font-bold text-base leading-tight">{t.info.waTitle}</p>
                <span className="text-[9px] font-bold bg-white/25 px-2 py-0.5 rounded-full uppercase tracking-wide flex-shrink-0">
                  {t.info.waBadge}
                </span>
              </div>
              <p className="text-sm text-white/75 leading-snug">
                {t.info.waDesc}
              </p>
            </div>
            <ArrowRight className="relative w-5 h-5 text-white/60 group-hover:text-white group-hover:translate-x-1 transition-all duration-200 flex-shrink-0" />
          </motion.a>
        </div>

        {/* ── Secondary options ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

          {/* Email */}
          <motion.a
            href={mailUrl}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] as const, delay: 0.16 }}
            className="group flex items-center gap-4 px-5 py-4 bg-white border border-gray-200 rounded-xl shadow-[0_2px_12px_-2px_rgba(0,0,0,0.08)] hover:shadow-[0_6px_20px_-4px_rgba(0,0,0,0.14)] hover:border-gray-300 hover:-translate-y-0.5 transition-all duration-200"
          >
            <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-200">
              <Mail className="w-4.5 h-4.5 text-blue-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-gray-800 leading-tight">{t.info.emailTitle}</p>
              <p className="text-xs text-gray-400 leading-snug">{t.info.emailDesc}</p>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-0.5 transition-all duration-200 flex-shrink-0" />
          </motion.a>

          {/* Lead form */}
          <motion.button
            onClick={() => setFormOpen(true)}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] as const, delay: 0.22 }}
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
          </motion.button>

        </div>
      </div>

      <LeadForm open={formOpen} onOpenChange={setFormOpen} />
    </section>
  );
}
