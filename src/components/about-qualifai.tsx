'use client';

import { motion } from 'framer-motion';
import { Cpu, GitMerge, Layers } from 'lucide-react';
import { useLocale } from '@/lib/i18n/context';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const, delay },
});

const STAT_ICONS = [Layers, GitMerge, Cpu];

export function AboutQualifAI() {
  const { t } = useLocale();

  const stats = [
    { value: t.about.stat1Value, label: t.about.stat1Label, icon: STAT_ICONS[0] },
    { value: t.about.stat2Value, label: t.about.stat2Label, icon: STAT_ICONS[1] },
    { value: t.about.stat3Value, label: t.about.stat3Label, icon: STAT_ICONS[2] },
  ];

  return (
    <section
      id="qualifai"
      aria-label="Sobre QualifAI"
      className="scroll-mt-16 bg-gradient-to-b from-white to-slate-50 border-t border-slate-100"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">

          {/* Left — text content */}
          <div>
            <motion.p
              {...fadeUp(0)}
              className="text-xs font-semibold uppercase tracking-widest text-emerald-600 mb-3"
            >
              {t.about.pill}
            </motion.p>

            <motion.h2
              {...fadeUp(0.08)}
              className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 leading-tight mb-5"
            >
              {t.about.title}
            </motion.h2>

            <motion.p
              {...fadeUp(0.16)}
              className="text-base sm:text-lg text-slate-600 leading-relaxed mb-7"
            >
              {t.about.body}
            </motion.p>
          </div>

          {/* Right — QualifAI brand card + stats */}
          <div className="flex flex-col gap-4">

            {/* Brand card */}
            <motion.div
              {...fadeUp(0.1)}
              className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-emerald-950 to-teal-900 p-6 shadow-lg"
            >
              {/* Dot pattern */}
              <div
                className="absolute inset-0 opacity-[0.15]"
                style={{
                  backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
                  backgroundSize: '22px 22px',
                }}
              />
              <div className="relative">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 bg-gradient-to-br from-emerald-400 to-teal-400 rounded-xl flex items-center justify-center shadow">
                    <Cpu className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-bold text-lg leading-none">QualifAI</p>
                    <p className="text-emerald-300/70 text-[11px] mt-0.5">AI-Powered Professional Matching</p>
                  </div>
                </div>
                <p className="text-white/60 text-xs leading-relaxed">
                  Connecting people with the right experts — automatically.
                </p>
              </div>
            </motion.div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              {stats.map((stat, i) => {
                const Icon = stat.icon;
                return (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1], delay: 0.18 + i * 0.08 }}
                    className="flex flex-col items-center text-center rounded-xl bg-white border border-slate-200/80 shadow-[0_1px_4px_-1px_rgba(0,0,0,0.06)] p-4"
                  >
                    <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center mb-2">
                      <Icon className="w-4 h-4 text-emerald-600" />
                    </div>
                    <p className="text-2xl font-extrabold text-slate-900 leading-none">{stat.value}</p>
                    <p className="text-[11px] text-slate-500 leading-snug mt-1">{stat.label}</p>
                  </motion.div>
                );
              })}
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
