'use client';

import { useState, useEffect } from 'react';
import { Shield, Menu, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLocale } from '@/lib/i18n/context';

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
}

function focusChat() {
  scrollTo('chat');
  setTimeout(() => {
    document.querySelector<HTMLInputElement>('#chat input')?.focus();
  }, 600);
}

export function Header() {
  const { lang, setLang, t } = useLocale();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.header
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
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
            <span className={`text-[10px] font-normal tracking-wide leading-none mt-0.5 ${ scrolled ? 'text-gray-400' : 'text-white/45' }`}>by QualifAI</span>
          </div>
        </a>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          <button
            onClick={() => scrollTo('como-funciona')}
            className={`text-sm font-medium transition-colors ${
              scrolled ? 'text-gray-600 hover:text-gray-900' : 'text-white/80 hover:text-white'
            }`}
          >
            {t.header.howItWorks}
          </button>
          <button
            onClick={() => scrollTo('qualifai')}
            className={`text-sm font-medium transition-colors ${
              scrolled ? 'text-gray-600 hover:text-gray-900' : 'text-white/80 hover:text-white'
            }`}
          >
            {t.header.aboutUs}
          </button>
          {/* TODO: Link a página QualifAI cuando exista */}

          {/* Language selector */}
          <div className="flex items-center gap-1 text-sm font-semibold">
            <button
              onClick={() => setLang('es')}
              className={`flex items-center gap-1.5 px-1.5 py-0.5 rounded transition-colors ${
                lang === 'es'
                  ? scrolled ? 'text-[var(--accent-9)]' : 'text-emerald-400'
                  : scrolled ? 'text-gray-400 hover:text-gray-700' : 'text-white/40 hover:text-white/70'
              }`}
            >
              <span className="fi fi-ar" style={{ borderRadius: 2, width: 18, height: 13, display: 'inline-block' }} />
              <span>ES</span>
            </button>
            <span className={scrolled ? 'text-gray-300' : 'text-white/20'}>|</span>
            <button
              onClick={() => setLang('en')}
              className={`flex items-center gap-1.5 px-1.5 py-0.5 rounded transition-colors ${
                lang === 'en'
                  ? scrolled ? 'text-[var(--accent-9)]' : 'text-emerald-400'
                  : scrolled ? 'text-gray-400 hover:text-gray-700' : 'text-white/40 hover:text-white/70'
              }`}
            >
              <span className="fi fi-us" style={{ borderRadius: 2, width: 18, height: 13, display: 'inline-block' }} />
              <span>EN</span>
            </button>
          </div>

          <button
            onClick={focusChat}
            className="inline-flex items-center bg-[var(--accent-9)] hover:bg-[var(--accent-10)] text-white text-sm font-semibold px-5 py-2.5 rounded-full transition-all hover:scale-[1.02] hover:shadow-md shadow-sm"
          >
            {t.header.startFree}
          </button>
        </nav>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? 'Cerrar menú' : 'Abrir menú'}
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile slide panel */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-5 space-y-3 shadow-lg">
          <button
            className="block w-full text-left text-sm text-gray-700 font-medium py-2 hover:text-[var(--accent-9)] transition-colors"
            onClick={() => { setMobileOpen(false); scrollTo('como-funciona'); }}
          >
            {t.header.howItWorks}
          </button>
          <button
            className="block w-full text-left text-sm text-gray-700 font-medium py-2 hover:text-[var(--accent-9)] transition-colors"
            onClick={() => { setMobileOpen(false); scrollTo('qualifai'); }}
          >
            {t.header.aboutUs}
          </button>
          {/* TODO: Link a página QualifAI cuando exista */}
          {/* Language selector — mobile */}
          <div className="flex items-center gap-2 py-1">
            <span className="text-xs text-gray-400 font-medium">Idioma / Language:</span>
            <button
              onClick={() => setLang('es')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-sm font-semibold transition-colors ${
                lang === 'es' ? 'bg-[var(--accent-3)] text-[var(--accent-9)]' : 'text-gray-400 hover:text-gray-700'
              }`}
            >
              <span className="fi fi-ar" style={{ borderRadius: 2, width: 18, height: 13, display: 'inline-block' }} />
              <span>ES</span>
            </button>
            <button
              onClick={() => setLang('en')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-sm font-semibold transition-colors ${
                lang === 'en' ? 'bg-[var(--accent-3)] text-[var(--accent-9)]' : 'text-gray-400 hover:text-gray-700'
              }`}
            >
              <span className="fi fi-us" style={{ borderRadius: 2, width: 18, height: 13, display: 'inline-block' }} />
              <span>EN</span>
            </button>
          </div>
          <button
            className="block w-full text-center bg-[var(--accent-9)] text-white text-sm font-semibold px-5 py-3 rounded-full transition-colors hover:bg-[var(--accent-10)]"
            onClick={() => { setMobileOpen(false); focusChat(); }}
          >
            {t.header.startFree}
          </button>
        </div>
      )}
    </motion.header>
  );
}
