'use client';

import { useState, useEffect, useRef } from 'react';
import { Shield, Menu, X, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';

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

const dropdownVariants: Variants = {
  hidden: { opacity: 0, y: -6, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.18, ease: 'easeOut' } },
  exit: { opacity: 0, y: -4, scale: 0.97, transition: { duration: 0.12 } },
};

function DesktopDropdown({ label, items }: { label: string; items: { label: string; href: string }[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div
      ref={ref}
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 transition-colors font-medium"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((v) => !v)}
      >
        {label}
        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.ul
            variants={dropdownVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            role="menu"
            className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-100 py-1.5 z-50 overflow-hidden"
          >
            {items.map((item) => (
              <li key={item.href} role="none">
                <a
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  role="menuitem"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[var(--accent-9)] transition-colors"
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

function MobileAccordion({ label, items }: { label: string; items: { label: string; href: string }[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        className="flex items-center justify-between w-full text-sm text-gray-700 font-medium py-2 hover:text-[var(--accent-9)] transition-colors"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        {label}
        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.ul
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden pl-3 border-l border-gray-200 ml-1"
          >
            {items.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-sm text-gray-600 py-2 hover:text-[var(--accent-9)] transition-colors"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Header() {
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
        <a href="#" className="flex items-center gap-2 font-bold text-gray-900 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 bg-gradient-to-br from-[var(--accent-9)] to-[var(--teal-9)] rounded-lg flex items-center justify-center shadow-sm">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg tracking-tight">DefensaYa</span>
        </a>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          <a
            href="#como-funciona"
            className="text-sm text-gray-600 hover:text-gray-900 transition-colors font-medium"
          >
            ¿Cómo funciona?
          </a>
          <DesktopDropdown label="Organismos" items={ORGANISMOS} />
          <DesktopDropdown label="Leyes" items={LEYES} />
          <a
            href="#chat"
            className="inline-flex items-center bg-[var(--accent-9)] hover:bg-[var(--accent-10)] text-white text-sm font-semibold px-5 py-2.5 rounded-full transition-all hover:scale-[1.02] hover:shadow-md shadow-sm"
          >
            Empezá gratis
          </a>
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
          <a
            href="#como-funciona"
            className="block text-sm text-gray-700 font-medium py-2 hover:text-[var(--accent-9)] transition-colors"
            onClick={() => setMobileOpen(false)}
          >
            ¿Cómo funciona?
          </a>
          <MobileAccordion label="Organismos" items={ORGANISMOS} />
          <MobileAccordion label="Leyes" items={LEYES} />
          <a
            href="#chat"
            className="block text-center bg-[var(--accent-9)] text-white text-sm font-semibold px-5 py-3 rounded-full transition-colors hover:bg-[var(--accent-10)]"
            onClick={() => setMobileOpen(false)}
          >
            Empezá gratis
          </a>
        </div>
      )}
    </motion.header>
  );
}
