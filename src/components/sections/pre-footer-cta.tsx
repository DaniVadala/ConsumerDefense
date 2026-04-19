'use client';

import { CalendarDays } from 'lucide-react';
import { useCalModal } from '../cal-modal';
import { useLocale } from '@/lib/i18n/context';
import { trackCalModalOpen, trackCalPreload } from '@/lib/analytics';

export function PreFooterCta() {
  const { t } = useLocale();
  const { openCalModal, preloadCal } = useCalModal();

  return (
    <section className="py-16 px-4 bg-gradient-to-br from-gray-900 via-emerald-950 to-teal-900 relative overflow-hidden">
      {/* Subtle dot pattern */}
      <div
        className="absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-emerald-700/20 via-transparent to-transparent" />

      <div
        className="relative max-w-2xl mx-auto text-center"
      >
        <div className="inline-flex items-center justify-center w-14 h-14 bg-emerald-500/20 rounded-2xl mb-5">
          <CalendarDays className="w-7 h-7 text-emerald-400" />
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight mb-3">
          {t.prefooter.title}
        </h2>
        <p className="text-emerald-100/60 text-base mb-8 max-w-md mx-auto">
          {t.prefooter.subtitle}
        </p>
        <button
          onClick={() => { trackCalModalOpen('prefooter'); openCalModal(); }}
          onPointerEnter={() => { trackCalPreload('prefooter'); preloadCal(); }}
          onFocus={() => { trackCalPreload('prefooter'); preloadCal(); }}
          className="cursor-pointer inline-flex items-center justify-center gap-2.5 bg-white hover:bg-gray-50 text-gray-900 text-base font-bold px-8 py-3.5 rounded-full shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl group"
        >
          <CalendarDays className="w-5 h-5 text-emerald-600" />
          {t.prefooter.cta}
        </button>
      </div>
    </section>
  );
}
