'use client';

import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useCalModal } from '@/components/cal-modal';
import { ArrowRight, MessageCircle } from 'lucide-react';
import { useLocale } from '@/lib/i18n/context';
import { trackChatFocus, trackCalModalOpen, trackCalPreload, trackWhatsAppClick } from '@/lib/analytics';
import { useChatAvailability } from '@/lib/chat-availability-context';

const ChatWidget = dynamic(
  () => import('@/components/chat/chat-widget').then(m => ({ default: m.ChatWidget })),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col h-full rounded-2xl overflow-hidden bg-white border border-gray-200">
        <div className="flex items-center gap-3 px-5 py-4" style={{ background: 'linear-gradient(135deg, var(--accent-9), var(--teal-9))' }}>
          <div className="w-10 h-10 bg-white/20 rounded-full" />
          <div className="space-y-1.5"><div className="h-3.5 w-20 bg-white/30 rounded" /><div className="h-2.5 w-32 bg-white/20 rounded" /></div>
        </div>
        <div className="flex-1 p-4 space-y-3" style={{ background: 'var(--slate-2)' }}>
          <div className="flex items-end gap-2"><div className="w-8 h-8 rounded-full bg-emerald-100" /><div className="bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-100"><div className="h-3 w-48 bg-gray-200 rounded animate-pulse" /></div></div>
        </div>
        <div className="px-4 py-3 bg-white border-t border-gray-100"><div className="h-10 bg-gray-100 rounded-2xl" /></div>
      </div>
    ),
  }
);

/**
 * Focuses the visible chat textarea.
 * Both mobile and desktop render a <ChatWidget />, so there are two [data-chat-input]
 * elements in the DOM. getElementById returns the first (hidden) one on desktop.
 * We pick the one whose offsetParent is non-null (i.e. not display:none).
 */
function focusChatInput() {
  const all = document.querySelectorAll<HTMLTextAreaElement>('[data-chat-input]');
  const textarea = Array.from(all).find((el) => el.offsetParent !== null);
  if (!textarea) return;
  trackChatFocus();
  textarea.focus();
  const rect = textarea.getBoundingClientRect();
  window.scrollTo({ top: Math.max(0, window.scrollY + rect.bottom - window.innerHeight + 20), behavior: 'smooth' });
}

export function Hero() {
  const { t } = useLocale();
  const { openCalModal, preloadCal } = useCalModal();
  const { chatAvailable } = useChatAvailability();

  const waUrl = 'https://wa.me/5493515284074?text=' + encodeURIComponent('Hola, necesito ayuda con un reclamo de consumidor');

  const handleCalOpen = () => { trackCalModalOpen('hero'); openCalModal(); };
  const handleCalPreload = () => { trackCalPreload('hero'); preloadCal(); };

  return (
    <section
      id="chat"
      className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-emerald-950 to-teal-900 pt-16 scroll-mt-16"
    >
      <div
        className="dot-drift-anim absolute -inset-[30px] opacity-[0.22]"
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
          <h1 className="text-3xl font-extrabold text-white leading-[1.1] tracking-tight text-center">
            {t.hero.headline1}{' '}
            <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
              {t.hero.headline2}
            </span>
          </h1>

          {/* 2. Subtitle */}
          <p className="text-base text-emerald-100/75 text-center leading-relaxed -mt-1">
            {t.hero.subtitle}
          </p>

          {/* 3. Trust pills */}
          <div className="flex flex-wrap gap-2 justify-center">
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
          </div>

          {/* 4. Chat widget — fixed height so it doesn't collapse */}
          <div>
            {/* Pill above widget — only shown when chat is available */}
            {chatAvailable && (
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
            )}
            <div className="h-[480px] rounded-2xl overflow-hidden shadow-[0_8px_48px_-8px_rgba(0,0,0,0.55),0_0_0_1px_rgba(255,255,255,0.08)] ring-1 ring-white/10">
              <ChatWidget />
            </div>
          </div>

          {/* 5. Lawyer image — social proof before CTA */}
          <div
            className="flex justify-center -mb-2"
          >
            {/* PERF: next/image for automatic WebP/AVIF and lazy loading */}
            <Image
              src="/lawyer-img.png"
              alt="Abogada profesional"
              width={240}
              height={180}
              className="h-[180px] w-auto object-contain object-bottom drop-shadow-[0_6px_24px_rgba(0,0,0,0.45)]"
              style={{ maskImage: 'linear-gradient(to top, transparent 0%, black 30%)', WebkitMaskImage: 'linear-gradient(to top, transparent 0%, black 30%)' }}
              priority={false}
            />
          </div>

          {/* 6. CTA + WA link */}
          <div className="flex flex-col items-center gap-1.5">
            {chatAvailable ? (
              <button
                onClick={focusChatInput}
                className="cursor-pointer inline-flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-900 text-base font-bold px-8 py-3 rounded-full shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl w-full group"
              >
                {t.hero.ctaButton}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
              </button>
            ) : (
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackWhatsAppClick('hero')}
                className="inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1faf38] text-white text-base font-bold px-8 py-3 rounded-full shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl w-full"
              >
                <MessageCircle className="w-5 h-5 fill-white" strokeWidth={1.5} />
                Escribinos por WhatsApp
              </a>
            )}
            <span className="text-xs text-white/55">{t.hero.ctaSubtext}</span>

            {/* Secondary CTA — Cal.com meeting */}
            <div className="flex flex-col items-center gap-1 mt-3 w-full">
              <button
                onClick={handleCalOpen}
                onPointerEnter={handleCalPreload}
                onFocus={handleCalPreload}
                className="cursor-pointer inline-flex items-center justify-center gap-2 border border-white/30 bg-transparent hover:bg-white/10 text-white text-sm font-semibold px-6 py-2.5 rounded-full transition-all whitespace-nowrap w-auto group"
              >
                {t.hero.calButton}
              </button>
              <span className="text-[11px] text-white/40">{t.hero.calSubtext}</span>
            </div>
          </div>

        </div>
        </div>
        {/* ===================== END MOBILE LAYOUT ===================== */}

        {/* ===================== DESKTOP LAYOUT (hidden on mobile) ===================== */}
        <div className="hidden lg:block py-14">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          {/* Left: title + image + CTA */}
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left">

            {/* Headline */}
            <h1 className="text-4xl md:text-5xl font-extrabold text-white leading-[1.08] tracking-tight mb-4">
              {t.hero.headline1}{' '}
              <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
                {t.hero.headline2}
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg text-emerald-100/80 max-w-sm mb-4 leading-relaxed mx-auto lg:mx-0">
              {t.hero.subtitle}
            </p>

            {/* Trust pills */}
            <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
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
            </div>

            {/* Lawyer image floating — transparent PNG, no box */}
            <div
              className="flex flex-col items-center lg:items-start"
            >
              {/* PERF: next/image for automatic WebP/AVIF and lazy loading */}
              <Image
                src="/lawyer-img.png"
                alt="Abogada profesional"
                width={533}
                height={400}
                className="h-[400px] w-auto object-contain object-bottom drop-shadow-[0_8px_40px_rgba(0,0,0,0.4)]"
                priority
              />
              {/* CTA buttons — overlap the bottom of the image */}
              <div className="flex flex-col items-center gap-1 w-full max-w-sm -mt-8 relative z-10">
                  {chatAvailable ? (
                    <button
                      onClick={focusChatInput}
                      className="cursor-pointer inline-flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-900 text-base font-bold px-8 py-3 rounded-full shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl w-full group"
                    >
                      {t.hero.ctaButton}
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
                    </button>
                  ) : (
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => trackWhatsAppClick('hero')}
                      className="inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1faf38] text-white text-base font-bold px-8 py-3 rounded-full shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl w-full"
                    >
                      <MessageCircle className="w-5 h-5 fill-white" strokeWidth={1.5} />
                      Escribinos por WhatsApp
                    </a>
                  )}
                  <span className="text-xs text-white/60">{t.hero.ctaSubtext}</span>

                  {/* Secondary CTA — Cal.com meeting */}
                  <div className="flex flex-col items-center gap-1 mt-3 w-full">
                    <button
                      onClick={handleCalOpen}
                      onPointerEnter={handleCalPreload}
                      onFocus={handleCalPreload}
                      className="cursor-pointer inline-flex items-center justify-center gap-2 border border-white/30 bg-transparent hover:bg-white/10 text-white text-sm font-semibold px-6 py-2.5 rounded-full transition-all whitespace-nowrap w-auto group"
                    >
                      {t.hero.calButton}
                    </button>
                    <span className="text-[11px] text-white/40">{t.hero.calSubtext}</span>
                  </div>
              </div>
            </div>

          </div>

          {/* Right: Real chat widget — stretches to match left column height */}
          <div
            className="relative"
          >
            {/* absolute inset-0 creates a definite height context so flex children can scroll */}
            <div className="absolute inset-0 flex justify-center">
              <div className="relative w-full max-w-md flex flex-col gap-3">
                {/* Glow halo */}
                <div className="absolute -inset-4 bg-gradient-to-r from-[var(--accent-9)]/20 to-[var(--teal-9)]/20 rounded-3xl blur-2xl pointer-events-none" />
                {/* Pill — above chat widget — only shown when chat is available */}
                {chatAvailable && (
                  <div className="relative flex-shrink-0 flex justify-center pt-1">
                    <button
                      onClick={() => {
                        document.querySelector<HTMLTextAreaElement>('[data-chat-input]')?.focus();
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
                )}
                <div className="relative flex-1 overflow-hidden rounded-2xl min-h-0 shadow-[0_8px_48px_-8px_rgba(0,0,0,0.55),0_0_0_1px_rgba(255,255,255,0.08)] ring-1 ring-white/10">
                  <ChatWidget />
                </div>
              </div>
            </div>
          </div>

        </div>
        </div>
        {/* ===================== END DESKTOP LAYOUT ===================== */}

      </div>
    </section>
  );
}
