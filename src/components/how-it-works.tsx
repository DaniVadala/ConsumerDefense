import { MessageCircle, FileCheck, Scale, Clock } from 'lucide-react';

const steps = [
  {
    icon: MessageCircle,
    title: 'Contanos tu problema',
    description: 'Escribí lo que pasó como si le contaras a un amigo. Sin tecnicismos.',
    step: '1',
    time: '~1 min',
    gradient: 'from-emerald-500 to-teal-500',
    bgLight: 'from-emerald-50 to-teal-50',
  },
  {
    icon: FileCheck,
    title: 'Recibí un diagnóstico',
    description: 'Nuestro asistente analiza tu caso y te dice qué podés hacer.',
    step: '2',
    time: '~2 min',
    gradient: 'from-teal-500 to-cyan-500',
    bgLight: 'from-teal-50 to-cyan-50',
  },
  {
    icon: Scale,
    title: 'Hablá con un abogado',
    description: 'Si querés avanzar, te conectamos gratis con un especialista.',
    step: '3',
    time: 'Mismo día',
    gradient: 'from-cyan-500 to-sky-500',
    bgLight: 'from-cyan-50 to-sky-50',
  },
];

export function HowItWorks() {
  return (
    <section
      id="como-funciona"
      className="py-24 px-4 bg-gradient-to-b from-slate-50 to-white scroll-mt-16"
    >
      <div className="max-w-5xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-[var(--accent-3)] text-[var(--accent-11)] text-xs font-semibold px-4 py-2 rounded-full mb-4">
            Simple y rápido
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3 tracking-tight">
            ¿Cómo funciona?
          </h2>
          <p className="text-gray-500 text-base md:text-lg max-w-md mx-auto">
            En menos de 5 minutos sabés qué opciones tenés para defenderte.
          </p>
        </div>

        {/* Steps grid */}
        <div className="relative">
          {/* Connector line — desktop only */}
          <div className="hidden md:block absolute top-[3.5rem] left-[calc(16.666%+2.5rem)] right-[calc(16.666%+2.5rem)] h-px bg-gradient-to-r from-emerald-200 via-teal-200 to-cyan-200 z-0" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
            {steps.map(({ icon: Icon, title, description, step, time, gradient, bgLight }) => (
              <div
                key={step}
                className="group flex flex-col items-center text-center bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-default"
              >
                {/* Icon with nested gradient layers */}
                <div className="relative mb-5">
                  <div
                    className={`w-20 h-20 bg-gradient-to-br ${bgLight} rounded-2xl flex items-center justify-center border border-gray-100 group-hover:scale-105 transition-transform duration-300`}
                  >
                    <div
                      className={`w-12 h-12 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center shadow-md`}
                    >
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  {/* Step number badge */}
                  <div
                    className={`absolute -top-2.5 -right-2.5 w-7 h-7 bg-gradient-to-br ${gradient} text-white text-xs font-black rounded-full flex items-center justify-center shadow-md ring-2 ring-white`}
                  >
                    {step}
                  </div>
                </div>

                <h3 className="font-bold text-gray-900 mb-2 text-lg tracking-tight">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed mb-5">{description}</p>

                {/* Time estimate pill */}
                <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-100 rounded-full px-3 py-1.5 mt-auto">
                  <Clock className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-xs font-medium text-gray-500">{time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
