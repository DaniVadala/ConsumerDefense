'use client';

import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useCalModal } from '@/components/cal-modal';
import { ArrowRight, RotateCcw } from 'lucide-react';
import { useLocale } from '@/lib/i18n/context';
import { trackChatFocus, trackCalModalOpen, trackCalPreload } from '@/lib/analytics';
import { useChatAvailability } from '@/lib/chat-availability-context';

const ChatContainer = dynamic(
  () => import('@/components/chat/thread').then(m => ({ default: m.ChatContainer })),
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

const WHATSAPP_NUMBER = '5493515284074';

const HERO_WA_MESSAGES: Record<string, string> = {
  insulto:      'Hola DefensaYa, necesito ayuda con un reclamo de consumo.',
  absurdo:      'Hola DefensaYa, necesito ayuda con un reclamo de consumo.',
  no_conducente:'Hola DefensaYa, me costó explicar mi problema en el chat. ¿Pueden ayudarme con mi reclamo?',
  stuck:        'Hola DefensaYa, me costó explicar mi problema en el chat. ¿Pueden ayudarme con mi reclamo?',
  turn_cap:     'Hola DefensaYa, me costó explicar mi problema en el chat. ¿Pueden ayudarme con mi reclamo?',
  fuera_de_scope:'Hola DefensaYa, tengo una consulta y me dijeron que podían orientarme.',
  default:      'Hola DefensaYa, necesito ayuda con un reclamo de consumo.',
};

const HERO_WA_LABELS: Record<string, string> = {
  insulto:      'Contactar al equipo',
  absurdo:      'Contactar al equipo',
  no_conducente:'Hablar con un especialista',
  stuck:        'Hablar con un especialista',
  turn_cap:     'Hablar con un especialista',
  fuera_de_scope:'Consultar al equipo',
  default:      'Hablar con un especialista',
};

function WhatsAppHeroButton({ reason, className }: { reason?: string; className?: string }) {
  const r = reason ?? 'default';
  const text = HERO_WA_MESSAGES[r] ?? HERO_WA_MESSAGES.default;
  const label = HERO_WA_LABELS[r] ?? HERO_WA_LABELS.default;
  const href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center justify-center gap-2 text-white text-base font-bold px-8 py-3 rounded-full shadow-lg transition-all hover:opacity-90 hover:scale-[1.02] hover:shadow-xl w-full ${className ?? ''}`}
      style={{ background: '#25D366' }}
    >
      <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current flex-shrink-0" aria-hidden="true">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
        <path d="M11.894 0C5.354 0 0 5.353 0 11.893c0 2.098.547 4.142 1.588 5.945L.057 24l6.304-1.654a11.913 11.913 0 005.533 1.375h.005C18.43 23.721 23.786 18.369 23.786 11.83 23.786 5.29 18.433-.001 11.894 0zm0 21.785h-.004a9.892 9.892 0 01-5.044-1.381l-.361-.214-3.742.981.998-3.648-.235-.374a9.842 9.842 0 01-1.51-5.27c0-5.445 4.432-9.876 9.882-9.876 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.89-9.865 9.89z" />
      </svg>
      {label}
    </a>
  );
}

export function Hero() {
  const { t } = useLocale();
  const { openCalModal, preloadCal } = useCalModal();
  const { chatAvailable, resetKey, isConversationEnded, resetConversation, isRateLimited, heroWhatsAppReason } = useChatAvailability();
  const showHeroWhatsApp = isRateLimited || heroWhatsAppReason !== null;
  const heroWaReason = heroWhatsAppReason ?? 'default';

  const handleCalOpen = () => { trackCalModalOpen('hero'); openCalModal(); };
  const handleCalPreload = () => { trackCalPreload('hero'); preloadCal(); };

  const handleCtaClickDesktop = () => {
    if (isConversationEnded) { resetConversation(); return; }
    focusChatInput();
  };

  const handleCtaClickMobile = () => {
    if (isConversationEnded) { resetConversation(); return; }
    document.getElementById('chat')?.scrollIntoView({ behavior: 'smooth' });
  };

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
          <h1 className="text-2xl font-extrabold text-white leading-[1.1] tracking-tight text-center">
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
              <ChatContainer key={resetKey} />
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

          {/* 6. CTA */}
          <div className="flex flex-col items-center gap-1.5">
            {chatAvailable && (
              showHeroWhatsApp ? (
                <WhatsAppHeroButton reason={heroWaReason} />
              ) : (
                <button
                  onClick={handleCtaClickMobile}
                  className="cursor-pointer inline-flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-900 text-base font-bold px-8 py-3 rounded-full shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl w-full group"
                >
                  {isConversationEnded ? (
                    <><RotateCcw className="w-4 h-4 flex-shrink-0" />{t.hero.ctaButtonReset}</>
                  ) : (
                    <>{t.hero.ctaButton}<ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" /></>
                  )}
                </button>
              )
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
            <h1 className="text-[2.5rem] font-extrabold text-white leading-[1.08] tracking-tight mb-4">
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
                  {chatAvailable && (
                    showHeroWhatsApp ? (
                      <WhatsAppHeroButton reason={heroWaReason} />
                    ) : (
                      <button
                        onClick={handleCtaClickDesktop}
                        className="cursor-pointer inline-flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-900 text-base font-bold px-8 py-3 rounded-full shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl w-full group"
                      >
                        {isConversationEnded ? (
                          <><RotateCcw className="w-4 h-4 flex-shrink-0" />{t.hero.ctaButtonReset}</>
                        ) : (
                          <>{t.hero.ctaButton}<ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" /></>
                        )}
                      </button>
                    )
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
                  <ChatContainer key={resetKey} />
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
