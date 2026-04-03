'use client';

import { useState } from 'react';
import { MessageCircle, FileCheck, Scale, Mail, User, ChevronRight } from 'lucide-react';
import { LeadForm } from './lead-form';
import { motion } from 'framer-motion';

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const, delay: i * 0.08 },
  }),
};

const WHATSAPP_NUMBER = '5493512852894';
const CONTACT_EMAIL = 'summalegales@gmail.com';

const steps = [
  {
    icon: MessageCircle,
    title: 'Contanos tu problema',
    description: 'Escribí lo que pasó como si le contaras a un amigo. Sin tecnicismos.',
    step: '1',
    time: '~1 min',
    gradient: 'from-emerald-500 to-teal-500',
  },
  {
    icon: FileCheck,
    title: 'Recibí un diagnóstico',
    description: 'Nuestro asistente analiza tu caso y te dice qué podés hacer.',
    step: '2',
    time: '~2 min',
    gradient: 'from-teal-500 to-cyan-500',
  },
  {
    icon: Scale,
    title: 'Hablá con un abogado',
    description: 'Si querés avanzar, te conectamos gratis con un especialista.',
    step: '3',
    time: 'Mismo día',
    gradient: 'from-cyan-500 to-sky-500',
  },
];

export function InfoSection() {
  const [formOpen, setFormOpen] = useState(false);

  const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hola! Tengo un problema de consumo y quiero orientación')}`;
  const mailUrl = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('Consulta DefensaYa')}&body=${encodeURIComponent('Hola, tengo un problema de consumo...')}`;

  return (
    <section id="como-funciona" className="py-16 lg:py-20 px-4 bg-white scroll-mt-16">
      <div className="max-w-6xl mx-auto">

        {/* Section headers — same 7-col grid as cards so divider aligns with the spacer gap */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] as const }}
          className="hidden lg:grid lg:[grid-template-columns:repeat(3,minmax(0,1fr))_2.5rem_repeat(3,minmax(0,1fr))] gap-x-4 mb-8"
        >
          <div className="col-span-3">
            <div className="inline-flex items-center gap-2 bg-[var(--accent-3)] text-[var(--accent-11)] text-xs font-semibold px-4 py-2 rounded-full mb-3">
              Simple y rápido
            </div>
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">¿Cómo funciona?</h2>
            <p className="text-gray-500 text-sm mt-1">
              En menos de 5 minutos sabés qué opciones tenés para defenderte.
            </p>
          </div>
          {/* spacer column */}
          <div />
          <div className="col-span-3 border-l border-gray-200 pl-4">
            <div className="inline-flex items-center gap-2 bg-gray-200 text-gray-600 text-xs font-semibold px-4 py-2 rounded-full mb-3">
              Múltiples canales
            </div>
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">¿Preferís otro canal?</h2>
            <p className="text-gray-500 text-sm mt-1">
              Contactanos por donde te resulte más cómodo. Respondemos en minutos.
            </p>
          </div>
        </motion.div>
        {/* MOBILE/TABLET — Sección 1: Cómo funciona */}
        <div className="lg:hidden mb-10">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] as const }}
            className="text-center mb-6"
          >
            <div className="inline-flex items-center gap-2 bg-[var(--accent-3)] text-[var(--accent-11)] text-xs font-semibold px-4 py-2 rounded-full mb-3">
              Simple y rápido
            </div>
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">¿Cómo funciona?</h2>
            <p className="text-gray-500 text-sm mt-1">En menos de 5 minutos sabés qué opciones tenés para defenderte.</p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {steps.map(({ icon: Icon, title, description, step, gradient }, i) => (
              <motion.div
                key={`mob-step-${step}`}
                custom={i}
                variants={cardVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-40px' }}
                className="flex flex-col items-center text-center bg-white rounded-2xl p-5 border border-gray-100 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_28px_-4px_rgba(0,0,0,0.13)] transition-shadow duration-200"
              >
                <div className="relative mb-4">
                  <div className={`w-12 h-12 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center shadow-md`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-5 h-5 bg-gray-900 text-white text-[10px] font-black rounded-full flex items-center justify-center">
                    {step}
                  </div>
                </div>
                <h3 className="font-bold text-gray-900 text-sm mb-1 leading-tight">{title}</h3>
                <p className="text-gray-400 text-xs leading-relaxed">{description}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* MOBILE/TABLET — Sección 2: Canales */}
        <div className="lg:hidden mb-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] as const }}
            className="text-center mb-6"
          >
            <div className="inline-flex items-center gap-2 bg-gray-200 text-gray-600 text-xs font-semibold px-4 py-2 rounded-full mb-3">
              Múltiples canales
            </div>
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">¿Preferís otro canal?</h2>
            <p className="text-gray-500 text-sm mt-1">Contactanos por donde te resulte más cómodo. Respondemos en minutos.</p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <motion.a
              custom={0}
              variants={cardVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-40px' }}
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col items-center text-center p-5 bg-white border border-gray-100 rounded-2xl shadow-[0_4px_20px_-2px_rgba(0,0,0,0.08)] hover:shadow-[0_20px_48px_-6px_rgba(0,0,0,0.22)] hover:scale-[1.04] hover:-translate-y-1 transition-all duration-200 cursor-pointer"
            >
              <div className="h-6 mb-3 flex items-center justify-center">
                <span className="bg-green-100 text-green-700 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                  Recomendado
                </span>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                <MessageCircle className="w-6 h-6 text-[#25D366] fill-[#25D366]" />
              </div>
              <p className="font-bold text-sm text-gray-900 mb-1 leading-tight">WhatsApp</p>
              <p className="text-xs text-gray-400 leading-relaxed">Escribinos directo. Respondemos en minutos.</p>
              <div className="mt-auto pt-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-200 group-hover:bg-[#25D366] transition-colors duration-200">
                  <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors duration-200" />
                </div>
              </div>
            </motion.a>
            <motion.a
              custom={1}
              variants={cardVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-40px' }}
              href={mailUrl}
              className="group flex flex-col items-center text-center p-5 bg-white border border-gray-100 rounded-2xl shadow-[0_4px_20px_-2px_rgba(0,0,0,0.08)] hover:shadow-[0_20px_48px_-6px_rgba(0,0,0,0.22)] hover:scale-[1.04] hover:-translate-y-1 transition-all duration-200 cursor-pointer"
            >
              <div className="h-6 mb-3" />
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-4">
                <Mail className="w-6 h-6 text-blue-600" />
              </div>
              <p className="font-bold text-sm text-gray-900 mb-1 leading-tight">Email</p>
              <p className="text-xs text-gray-400 leading-relaxed">Mandanos tu caso y te respondemos por escrito.</p>
              <div className="mt-auto pt-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-200 group-hover:bg-blue-600 transition-colors duration-200">
                  <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors duration-200" />
                </div>
              </div>
            </motion.a>
            <motion.button
              custom={2}
              variants={cardVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-40px' }}
              onClick={() => setFormOpen(true)}
              className="group flex flex-col items-center text-center p-5 bg-white border border-gray-100 rounded-2xl shadow-[0_4px_20px_-2px_rgba(0,0,0,0.08)] hover:shadow-[0_20px_48px_-6px_rgba(0,0,0,0.22)] hover:scale-[1.04] hover:-translate-y-1 transition-all duration-200 cursor-pointer"
            >
              <div className="h-6 mb-3" />
              <div className="w-12 h-12 bg-[var(--accent-3)] rounded-xl flex items-center justify-center mb-4">
                <User className="w-6 h-6 text-[var(--accent-9)]" />
              </div>
              <p className="font-bold text-sm text-gray-900 mb-1 leading-tight">Dejá tus datos</p>
              <p className="text-xs text-gray-400 leading-relaxed">Completá el formulario y te contactamos.</p>
              <div className="mt-auto pt-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-200 group-hover:bg-[var(--accent-9)] transition-colors duration-200">
                  <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors duration-200" />
                </div>
              </div>
            </motion.button>
          </div>
        </div>

        {/* DESKTOP — grid 7 columnas (col 4 = spacer) */}
        <div className="hidden lg:grid lg:[grid-template-columns:repeat(3,minmax(0,1fr))_2.5rem_repeat(3,minmax(0,1fr))] gap-4">

          {/* ── Step cards ── */}
          {steps.map(({ icon: Icon, title, description, step, gradient }, i) => (
            <motion.div
              key={step}
              custom={i}
              variants={cardVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-40px' }}
              className="flex flex-col items-center text-center bg-white rounded-2xl p-5 border border-gray-100 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_28px_-4px_rgba(0,0,0,0.13)] transition-shadow duration-200"
            >
              {/* Badge slot */}
              <div className="h-6 mb-3" />
              <div className="relative mb-4">
                <div className={`w-12 h-12 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center shadow-md`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-5 h-5 bg-gray-900 text-white text-[10px] font-black rounded-full flex items-center justify-center">
                  {step}
                </div>
              </div>
              <h3 className="font-bold text-gray-900 text-sm mb-1 leading-tight">{title}</h3>
              <p className="text-gray-400 text-xs leading-relaxed">{description}</p>
            </motion.div>
          ))}

          {/* ── Channel cards ── */}

          {/* WhatsApp — col-start-5 skips the spacer column */}
          <motion.a
            custom={3}
            variants={cardVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-40px' }}
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="col-start-5 group flex flex-col items-center text-center p-5 bg-white border border-gray-100 rounded-2xl shadow-[0_4px_20px_-2px_rgba(0,0,0,0.08)] hover:shadow-[0_20px_48px_-6px_rgba(0,0,0,0.22)] hover:scale-[1.04] hover:-translate-y-1 transition-all duration-200 cursor-pointer"
          >
            <div className="h-6 mb-3 flex items-center justify-center">
              <span className="bg-green-100 text-green-700 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                Recomendado
              </span>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
              <MessageCircle className="w-6 h-6 text-[#25D366] fill-[#25D366]" />
            </div>
            <p className="font-bold text-sm text-gray-900 mb-1 leading-tight">WhatsApp</p>
            <p className="text-xs text-gray-400 leading-relaxed">Escribinos directo. Respondemos en minutos.</p>
            <div className="mt-auto pt-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-200 group-hover:bg-[#25D366] transition-colors duration-200">
                <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors duration-200" />
              </div>
            </div>
          </motion.a>

          {/* Email */}
          <motion.a
            custom={4}
            variants={cardVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-40px' }}
            href={mailUrl}
            className="group flex flex-col items-center text-center p-5 bg-white border border-gray-100 rounded-2xl shadow-[0_4px_20px_-2px_rgba(0,0,0,0.08)] hover:shadow-[0_20px_48px_-6px_rgba(0,0,0,0.22)] hover:scale-[1.04] hover:-translate-y-1 transition-all duration-200 cursor-pointer"
          >
            <div className="h-6 mb-3" />
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-4">
              <Mail className="w-6 h-6 text-blue-600" />
            </div>
            <p className="font-bold text-sm text-gray-900 mb-1 leading-tight">Email</p>
            <p className="text-xs text-gray-400 leading-relaxed">Mandanos tu caso y te respondemos por escrito.</p>
            <div className="mt-auto pt-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-200 group-hover:bg-blue-600 transition-colors duration-200">
                <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors duration-200" />
              </div>
            </div>
          </motion.a>

          {/* Lead form */}
          <motion.button
            custom={5}
            variants={cardVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-40px' }}
            onClick={() => setFormOpen(true)}
            className="group flex flex-col items-center text-center p-5 bg-white border border-gray-100 rounded-2xl shadow-[0_4px_20px_-2px_rgba(0,0,0,0.08)] hover:shadow-[0_20px_48px_-6px_rgba(0,0,0,0.22)] hover:scale-[1.04] hover:-translate-y-1 transition-all duration-200 cursor-pointer"
          >
            <div className="h-6 mb-3" />
            <div className="w-12 h-12 bg-[var(--accent-3)] rounded-xl flex items-center justify-center mb-4">
              <User className="w-6 h-6 text-[var(--accent-9)]" />
            </div>
            <p className="font-bold text-sm text-gray-900 mb-1 leading-tight">Dejá tus datos</p>
            <p className="text-xs text-gray-400 leading-relaxed">Completá el formulario y te contactamos.</p>
            <div className="mt-auto pt-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-200 group-hover:bg-[var(--accent-9)] transition-colors duration-200">
                <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors duration-200" />
              </div>
            </div>
          </motion.button>

        </div>
      </div>

      <LeadForm open={formOpen} onOpenChange={setFormOpen} />
    </section>
  );
}
