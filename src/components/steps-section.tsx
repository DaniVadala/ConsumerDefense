'use client';

import { MessageCircle, FileCheck, Scale } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLocale } from '@/lib/i18n/context';

const STEP_META = [
  { icon: MessageCircle, step: '01', gradient: 'from-emerald-500 to-teal-500', ring: 'ring-emerald-200', glow: 'shadow-emerald-200/60' },
  { icon: FileCheck,     step: '02', gradient: 'from-teal-500 to-cyan-500',    ring: 'ring-teal-200',    glow: 'shadow-teal-200/60'    },
  { icon: Scale,         step: '03', gradient: 'from-cyan-500 to-sky-500',     ring: 'ring-cyan-200',    glow: 'shadow-cyan-200/60'    },
];

export function StepsSection() {
  const { t } = useLocale();
  const steps = t.steps.steps.map((s, i) => ({ ...s, ...STEP_META[i] }));
  return (
    <section
      id="como-funciona"
      aria-label="Cómo funciona"
      className="scroll-mt-16 bg-gradient-to-b from-slate-50 to-white border-b border-gray-100"
    >
      <div className="max-w-6xl mx-auto px-6 py-10 lg:py-12">

        {/* Label + title */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 bg-[var(--accent-3)] text-[var(--accent-11)] text-xs font-semibold px-4 py-1.5 rounded-full mb-3">
            {t.steps.pill}
          </div>
          <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 tracking-tight">
            {t.steps.title}
          </h2>
          <p className="text-gray-400 text-sm mt-1.5">
            {t.steps.subtitle}
          </p>
        </motion.div>

        {/* ── Desktop stepper ── */}
        <div className="hidden md:block relative">
          {/* Gradient line — runs from center of icon 1 to center of icon 3 */}
          <div
            className="absolute h-px top-8 z-0"
            style={{ left: 'calc(16.667% + 2rem)', right: 'calc(16.667% + 2rem)' }}
          >
            <div className="w-full h-full bg-gradient-to-r from-emerald-300 via-teal-300 to-cyan-300 rounded-full" />
            {/* Arrow chevrons at connector midpoints */}
            <div className="absolute inset-0 flex items-center justify-around px-4 pointer-events-none">
              {[0, 1].map((k) => (
                <svg key={k} width="18" height="18" viewBox="0 0 18 18" fill="none" className="flex-shrink-0 drop-shadow-sm">
                  <circle cx="9" cy="9" r="9" fill="white" />
                  <path d="M7 5.5L11 9L7 12.5" stroke="#14b8a6" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-8">
            {steps.map(({ icon: Icon, step, title, description, time, gradient, ring, glow }, i) => (
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: i * 0.12 }}
                className="relative z-10 flex flex-col items-center text-center"
              >
                {/* Icon badge */}
                <div className="relative mb-5">
                  <div
                    className={`w-16 h-16 bg-gradient-to-br ${gradient} rounded-2xl flex items-center justify-center shadow-lg ${glow} ring-4 ${ring} ring-offset-2 ring-offset-white`}
                  >
                    <Icon className="w-7 h-7 text-white" strokeWidth={1.75} />
                  </div>
                  <div className="absolute -top-3 -right-3 bg-white border border-gray-200 text-gray-500 text-[10px] font-black px-1.5 py-0.5 rounded-md shadow-sm tracking-widest">
                    {step}
                  </div>
                </div>

                <h3 className="font-bold text-gray-900 text-sm leading-tight mb-1.5">{title}</h3>
                <p className="text-gray-400 text-xs leading-relaxed max-w-[200px] mb-3">
                  {description}
                </p>
                <span className="text-[10px] font-semibold text-[var(--accent-11)] bg-[var(--accent-3)] px-2.5 py-0.5 rounded-full">
                  {time}
                </span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ── Mobile stepper — vertical timeline ── */}
        <div className="md:hidden">
          {steps.map(({ icon: Icon, step, title, description, time, gradient }, i) => (
            <div key={step} className="flex gap-5">
              {/* Left rail: circle + vertical connector */}
              <div className="flex flex-col items-center flex-shrink-0">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true, margin: '-30px' }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  className="relative"
                >
                  <div
                    className={`w-12 h-12 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center shadow-md`}
                  >
                    <Icon className="w-5 h-5 text-white" strokeWidth={1.75} />
                  </div>
                  <div className="absolute -top-2 -right-2 bg-white border border-gray-200 text-gray-500 text-[9px] font-black px-1 py-px rounded shadow-sm tracking-widest">
                    {step}
                  </div>
                </motion.div>
                {i < steps.length - 1 && (
                  <div className="w-px flex-1 bg-gradient-to-b from-gray-300 to-gray-100 my-2 min-h-[32px]" />
                )}
              </div>

              {/* Content */}
              <motion.div
                initial={{ opacity: 0, x: -12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-30px' }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className={i < steps.length - 1 ? 'pb-8' : 'pb-0'}
              >
                <div className="pt-2">
                  <h3 className="font-bold text-gray-900 text-sm mb-1 leading-tight">{title}</h3>
                  <p className="text-gray-400 text-xs leading-relaxed mb-2">{description}</p>
                  <span className="text-[10px] font-semibold text-[var(--accent-11)] bg-[var(--accent-3)] px-2.5 py-0.5 rounded-full">
                    {time}
                  </span>
                </div>
              </motion.div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
