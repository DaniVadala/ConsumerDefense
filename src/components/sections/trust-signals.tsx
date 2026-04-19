'use client';

import { Shield, Scale, Lock, BookOpen, BadgeCheck, Clock } from 'lucide-react';
import { useLocale } from '@/lib/i18n/context';

const SIGNAL_ICONS = [Scale, BookOpen, Lock, BadgeCheck, Clock, Shield];

export function TrustSignals() {
  const { t } = useLocale();
  return (
    <section className="bg-slate-50 py-14 lg:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Heading */}
        <div
          className="text-center mb-10"
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600 mb-2">
            {t.trust.pill}
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
            {t.trust.title}
          </h2>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {t.trust.signals.map((signal, i) => {
            const Icon = SIGNAL_ICONS[i];
            return (
              <div
                key={signal.title}
                className="flex gap-4 rounded-xl bg-white p-5 border border-slate-200/80 shadow-[0_1px_4px_-1px_rgba(0,0,0,0.06)]"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">{signal.title}</h3>
                  <p className="mt-0.5 text-sm leading-relaxed text-slate-500">
                    {signal.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
