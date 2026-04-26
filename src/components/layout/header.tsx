'use client';

import { useState, useEffect } from 'react';
import { Shield, Menu, X } from 'lucide-react';
import { useLocale } from '@/lib/i18n/context';
import { trackNavClick, trackLanguageChange } from '@/lib/analytics';

function ArgFlag() {
  return (
    <svg viewBox="0 0 900 600" width={18} height={13} aria-hidden="true" style={{ borderRadius: 2, display: 'inline-block', flexShrink: 0 }}>
      <rect fill="#74ACDF" width={900} height={600} />
      <rect fill="#FFF" y={200} width={900} height={200} />
      <circle fill="#F6B40E" cx={450} cy={300} r={55} />
    </svg>
  );
}

function UsFlag() {
  return (
    <svg viewBox="0 0 190 100" width={18} height={13} aria-hidden="true" style={{ borderRadius: 2, display: 'inline-block', flexShrink: 0 }}>
      <rect fill="#B22234" width={190} height={100} />
      <path d="M0,8h190M0,23h190M0,38h190M0,54h190M0,69h190M0,84h190" stroke="#FFF" strokeWidth={7.7} />
      <rect fill="#3C3B6E" width={76} height={54} />
    </svg>
  );
}

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
}

function focusChat() {
  const all = document.querySelectorAll<HTMLTextAreaElement>('[data-chat-input]');
  const textarea = Array.from(all).find((el) => el.offsetParent !== null);
  if (!textarea) return;
  textarea.focus();
  const rect = textarea.getBoundingClientRect();
  window.scrollTo({ top: Math.max(0, window.scrollY + rect.bottom - window.innerHeight + 20), behavior: 'smooth' });
}

function scrollToChat() {
  const widget = document.querySelector('[data-chat-widget]');
  widget?.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

export function Header() {
  const { lang, setLang, t } = useLocale();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 2);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 ${
        scrolled
          ? 'bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <a href="#" className={`flex items-center gap-2 font-bold hover:opacity-80 transition-opacity ${ scrolled ? 'text-gray-900' : 'text-white' }`}>
          <div className="w-8 h-8 bg-gradient-to-br from-[var(--accent-9)] to-[var(--teal-9)] rounded-lg flex items-center justify-center shadow-sm">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-lg tracking-tight leading-none">DefensaYa</span>
            <span className={`text-[10px] font-normal tracking-wide leading-none mt-0.5 ${ scrolled ? 'text-gray-400' : 'text-white/45' }`}>by SyndesiX</span>
          </div>
        </a>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          <button
            onClick={() => { trackNavClick('como-funciona', 'header'); scrollTo('como-funciona'); }}
            className={`cursor-pointer text-sm font-medium transition-colors ${
              scrolled ? 'text-gray-600 hover:text-gray-900' : 'text-white/80 hover:text-white'
            }`}
          >
            {t.header.howItWorks}
          </button>
          <button
            onClick={() => { trackNavClick('qualifai', 'header'); scrollTo('qualifai'); }}
            className={`cursor-pointer text-sm font-medium transition-colors ${
              scrolled ? 'text-gray-600 hover:text-gray-900' : 'text-white/80 hover:text-white'
            }`}
          >
            {t.header.aboutUs}
          </button>

          {/* Language selector */}
          <div className="flex items-center gap-1 text-sm font-semibold">
            <button
              onClick={() => { trackLanguageChange('es'); setLang('es'); }}
              aria-label="Cambiar a español"
              className={`flex items-center gap-1.5 px-1.5 py-0.5 rounded transition-colors cursor-pointer ${
                lang === 'es'
                  ? scrolled ? 'text-[var(--accent-9)]' : 'text-emerald-400'
                  : scrolled ? 'text-gray-400 hover:text-gray-700' : 'text-white/40 hover:text-white/70'
              }`}
            >
              <ArgFlag />
              <span>ES</span>
            </button>
            <span className={scrolled ? 'text-gray-300' : 'text-white/20'} aria-hidden="true">|</span>
            <button
              onClick={() => { trackLanguageChange('en'); setLang('en'); }}
              aria-label="Switch to English"
              className={`flex items-center gap-1.5 px-1.5 py-0.5 rounded transition-colors cursor-pointer ${
                lang === 'en'
                  ? scrolled ? 'text-[var(--accent-9)]' : 'text-emerald-400'
                  : scrolled ? 'text-gray-400 hover:text-gray-700' : 'text-white/40 hover:text-white/70'
              }`}
            >
              <UsFlag />
              <span>EN</span>
            </button>
          </div>

          <button
            onClick={() => { trackNavClick('empeza-gratis', 'header'); focusChat(); }}
            className="inline-flex items-center cursor-pointer bg-[var(--accent-9)] hover:bg-[var(--accent-10)] text-white text-sm font-semibold px-5 py-2.5 rounded-full transition-all hover:scale-[1.02] hover:shadow-md shadow-sm"
          >
            {t.header.startFree}
          </button>
        </nav>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={mobileOpen}
          aria-controls="mobile-nav"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile slide panel */}
      {mobileOpen && (
        <nav id="mobile-nav" role="navigation" aria-label="Menú móvil" className="md:hidden bg-white border-t border-gray-100 px-4 py-5 space-y-3 shadow-lg">
          <button
            className="block w-full text-left text-sm text-gray-700 font-medium py-2 hover:text-[var(--accent-9)] transition-colors"
            onClick={() => { setMobileOpen(false); trackNavClick('como-funciona', 'mobile_menu'); scrollTo('como-funciona'); }}
          >
            {t.header.howItWorks}
          </button>
          <button
            className="block w-full text-left text-sm text-gray-700 font-medium py-2 hover:text-[var(--accent-9)] transition-colors"
            onClick={() => { setMobileOpen(false); trackNavClick('qualifai', 'mobile_menu'); scrollTo('qualifai'); }}
          >
            {t.header.aboutUs}
          </button>
          {/* Language selector — mobile */}
          <div className="flex items-center gap-2 py-1">
            <span className="text-xs text-gray-400 font-medium">Idioma / Language:</span>
            <button
              onClick={() => { trackLanguageChange('es'); setLang('es'); }}
              aria-label="Cambiar a español"
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-sm font-semibold transition-colors cursor-pointer ${
                lang === 'es' ? 'bg-[var(--accent-3)] text-[var(--accent-9)]' : 'text-gray-400 hover:text-gray-700'
              }`}
            >
              <ArgFlag />
              <span>ES</span>
            </button>
            <button
              onClick={() => { trackLanguageChange('en'); setLang('en'); }}
              aria-label="Switch to English"
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-sm font-semibold transition-colors cursor-pointer ${
                lang === 'en' ? 'bg-[var(--accent-3)] text-[var(--accent-9)]' : 'text-gray-400 hover:text-gray-700'
              }`}
            >
              <UsFlag />
              <span>EN</span>
            </button>
          </div>
          <button
            className="block w-full text-center bg-[var(--accent-9)] text-white text-sm font-semibold px-5 py-3 rounded-full transition-colors hover:bg-[var(--accent-10)]"
            onClick={() => { setMobileOpen(false); trackNavClick('empeza-gratis', 'mobile_menu'); scrollToChat(); }}
          >
            {t.header.startFree}
          </button>
        </nav>
      )}
    </header>
  );
}
