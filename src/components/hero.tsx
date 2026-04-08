'use client';

import { ChatWidget } from '@/components/chat/chat-widget';
import { useCalModal } from '@/components/cal-modal';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLocale } from '@/lib/i18n/context';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 22 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const, delay },
});

/**
 * Focuses the visible chat textarea.
 * Both mobile and desktop render a <ChatWidget />, so there are two #chat-input
 * elements in the DOM. getElementById returns the first (hidden) one on desktop.
 * We pick the one whose offsetParent is non-null (i.e. not display:none).
 */
function focusChatInput() {
  const all = document.querySelectorAll<HTMLTextAreaElement>('#chat-input');
  const textarea = Array.from(all).find((el) => el.offsetParent !== null);
  if (!textarea) return;
  textarea.focus();
  const rect = textarea.getBoundingClientRect();
  window.scrollTo({ top: Math.max(0, window.scrollY + rect.bottom - window.innerHeight + 20), behavior: 'smooth' });
}

export function Hero() {
  const { t } = useLocale();
  const { openCalModal } = useCalModal();
  return (
    <section
      id="chat"
      className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-emerald-950 to-teal-900 pt-16 scroll-mt-16"
    >
      <div
        className="dot-drift-anim absolute inset-0 opacity-[0.22]"
        style={{
          backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
          backgroundSize: '30px 30px',
        }}
      />
      {/* Subtle radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-emerald-700/30 via-transparent to-transparent" />

      <div className="relative max-w-6xl mx-auto px-4 w-full">

        {/* ===================== MOBILE LAYOUT (hidden on lg+) ===================== */}
        <div className="lg:hidden py-8 pb-10">
        <div className="flex flex-col gap-5 max-w-[540px] mx-auto w-full">

          {/* 1. Headline */}
          <motion.h1 {...fadeUp(0)} className="text-3xl font-extrabold text-white leading-[1.1] tracking-tight text-center">
            {t.hero.headline1}{' '}
            <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
              {t.hero.headline2}
            </span>
          </motion.h1>

          {/* 2. Subtitle */}
          <motion.p {...fadeUp(0.1)} className="text-base text-emerald-100/75 text-center leading-relaxed -mt-1">
            {t.hero.subtitle}
          </motion.p>

          {/* 3. Trust pills */}
          <motion.div {...fadeUp(0.18)} className="flex flex-wrap gap-2 justify-center">
            <div className="flex items-center gap-1.5 bg-white/10 border border-white/20 rounded-full px-3 py-1.5">
              <span className="text-emerald-400 text-sm">⚡</span>
              <span className="text-sm font-medium text-white/80">{t.hero.pillImmediate}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/10 border border-white/20 rounded-full px-3 py-1.5">
              <span className="text-emerald-400 text-sm">🔒</span>
              <span className="text-sm font-medium text-white/80">{t.hero.pillConfidential}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/10 border border-white/20 rounded-full px-3 py-1.5">
              <span className="text-emerald-400 text-sm">✓</span>
              <span className="text-sm font-medium text-white/80">{t.hero.pillFree}</span>
            </div>
          </motion.div>

          {/* 4. Chat widget — fixed height so it doesn't collapse */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.26 }}
          >
            {/* Pill above widget — clickable */}
            <div className="flex justify-center mb-2">
              <button
                onClick={focusChatInput}
                className="cursor-pointer inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-emerald-300 text-xs font-semibold px-4 py-2 rounded-full border border-white/20 hover:bg-white/20 transition-colors"
              >
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                Diagnóstico inmediato con IA
                <span className="bg-emerald-400/20 text-emerald-300 text-[10px] px-2 py-0.5 rounded-full font-bold ml-1">GRATIS</span>
              </button>
            </div>
            <div className="h-[480px] rounded-2xl overflow-hidden shadow-[0_8px_48px_-8px_rgba(0,0,0,0.55),0_0_0_1px_rgba(255,255,255,0.08)] ring-1 ring-white/10">
              <ChatWidget />
            </div>
          </motion.div>

          {/* 5. Lawyer image — social proof before CTA */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.34 }}
            className="flex justify-center -mb-2"
          >
            <img
              src="/lawyer-img.png"
              alt="Abogada profesional"
              className="h-[180px] w-auto object-contain object-bottom drop-shadow-[0_6px_24px_rgba(0,0,0,0.45)]"
              style={{ maskImage: 'linear-gradient(to top, transparent 0%, black 30%)', WebkitMaskImage: 'linear-gradient(to top, transparent 0%, black 30%)' }}
            />
          </motion.div>

          {/* 6. CTA + WA link */}
          <motion.div {...fadeUp(0.42)} className="flex flex-col items-center gap-1.5">
            <button
              onClick={focusChatInput}
              className="cursor-pointer inline-flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-900 text-base font-bold px-8 py-3 rounded-full shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl w-full group"
            >
              {t.hero.ctaButton}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
            </button>
            <span className="text-xs text-white/55">{t.hero.ctaSubtext}</span>

            {/* Secondary CTA — Cal.com meeting */}
            <div className="flex flex-col items-center gap-1 mt-3 w-full">
              <button
                onClick={openCalModal}
                className="cursor-pointer inline-flex items-center justify-center gap-2 border border-white/30 bg-transparent hover:bg-white/10 text-white text-sm font-semibold px-6 py-2.5 rounded-full transition-all whitespace-nowrap w-auto group"
              >
                {t.hero.calButton}
              </button>
              <span className="text-[11px] text-white/40">{t.hero.calSubtext}</span>
            </div>
          </motion.div>

        </div>
        </div>
        {/* ===================== END MOBILE LAYOUT ===================== */}

        {/* ===================== DESKTOP LAYOUT (hidden on mobile) ===================== */}
        <div className="hidden lg:block py-14">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          {/* Left: title + image + CTA */}
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left">

            {/* Headline */}
            <motion.h1 {...fadeUp(0)} className="text-4xl md:text-5xl font-extrabold text-white leading-[1.08] tracking-tight mb-4">
              {t.hero.headline1}{' '}
              <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
                {t.hero.headline2}
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p {...fadeUp(0.18)} className="text-lg text-emerald-100/80 max-w-sm mb-4 leading-relaxed mx-auto lg:mx-0">
              {t.hero.subtitle}
            </motion.p>

            {/* Trust pills */}
            <motion.div {...fadeUp(0.24)} className="flex flex-wrap gap-2 justify-center lg:justify-start">
              <div className="flex items-center gap-1.5 bg-white/10 border border-white/20 rounded-full px-3 py-1.5">
                <span className="text-emerald-400 text-sm">⚡</span>
                <span className="text-sm font-medium text-white/80">{t.hero.pillImmediate}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/10 border border-white/20 rounded-full px-3 py-1.5">
                <span className="text-emerald-400 text-sm">🔒</span>
                <span className="text-sm font-medium text-white/80">{t.hero.pillConfidential}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/10 border border-white/20 rounded-full px-3 py-1.5">
                <span className="text-emerald-400 text-sm">✓</span>
                <span className="text-sm font-medium text-white/80">{t.hero.pillFree}</span>
              </div>
            </motion.div>

            {/* Lawyer image floating — transparent PNG, no box */}
            <motion.div
              {...fadeUp(0.28)}
              className="flex flex-col items-center lg:items-start"
            >
              <img
                src="/lawyer-img.png"
                alt="Abogada profesional"
                className="h-[400px] w-auto object-contain object-bottom drop-shadow-[0_8px_40px_rgba(0,0,0,0.4)]"
              />
              {/* CTA buttons — overlap the bottom of the image */}
              <div className="flex flex-col items-center gap-1 w-full max-w-sm -mt-8 relative z-10">
                  <button
                    onClick={focusChatInput}
                    className="cursor-pointer inline-flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-900 text-base font-bold px-8 py-3 rounded-full shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl w-full group"
                  >
                    {t.hero.ctaButton}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
                  </button>
                  <span className="text-xs text-white/60">{t.hero.ctaSubtext}</span>

                  {/* Secondary CTA — Cal.com meeting */}
                  <div className="flex flex-col items-center gap-1 mt-3 w-full">
                    <button
                      onClick={openCalModal}
                      className="cursor-pointer inline-flex items-center justify-center gap-2 border border-white/30 bg-transparent hover:bg-white/10 text-white text-sm font-semibold px-6 py-2.5 rounded-full transition-all whitespace-nowrap w-auto group"
                    >
                      {t.hero.calButton}
                    </button>
                    <span className="text-[11px] text-white/40">{t.hero.calSubtext}</span>
                  </div>
              </div>
            </motion.div>

          </div>

          {/* Right: Real chat widget — stretches to match left column height */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
            className="relative"
          >
            {/* absolute inset-0 creates a definite height context so flex children can scroll */}
            <div className="absolute inset-0 flex justify-center">
              <div className="relative w-full max-w-md flex flex-col gap-3">
                {/* Glow halo */}
                <div className="absolute -inset-4 bg-gradient-to-r from-[var(--accent-9)]/20 to-[var(--teal-9)]/20 rounded-3xl blur-2xl pointer-events-none" />
                {/* Pill — above chat widget — clickable */}
                <div className="relative flex-shrink-0 flex justify-center pt-1">
                  <button
                    onClick={() => {
                      document.getElementById('chat-input')?.focus();
                      document.getElementById('chat-widget')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                    className="cursor-pointer inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-emerald-300 text-xs font-semibold px-4 py-2 rounded-full border border-white/20 hover:bg-white/20 transition-colors"
                  >
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                    Diagnóstico inmediato con IA
                    <span className="bg-emerald-400/20 text-emerald-300 text-[10px] px-2 py-0.5 rounded-full font-bold ml-1">
                      GRATIS
                    </span>
                  </button>
                </div>
                <div className="relative flex-1 overflow-hidden rounded-2xl min-h-0 shadow-[0_8px_48px_-8px_rgba(0,0,0,0.55),0_0_0_1px_rgba(255,255,255,0.08)] ring-1 ring-white/10">
                  <ChatWidget />
                </div>
              </div>
            </div>
          </motion.div>

        </div>
        </div>
        {/* ===================== END DESKTOP LAYOUT ===================== */}

      </div>
    </section>
  );
}
