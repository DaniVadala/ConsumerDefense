'use client';

import { ChatWidget } from '@/components/chat/chat-widget';
import { motion } from 'framer-motion';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 22 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const, delay },
});

export function Hero() {
  return (
    <section
      id="chat"
      className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-emerald-950 to-teal-900 pt-16 scroll-mt-16"
    >
      {/* Dot-grid background pattern — animated drift */}
      <style>{`
        @keyframes dot-drift {
          from { background-position: 0px 0px; }
          to   { background-position: -30px 30px; }
        }
        .dot-drift-anim {
          animation: dot-drift 2.5s linear infinite;
        }
      `}</style>
      <div
        className="dot-drift-anim absolute inset-0 opacity-[0.22]"
        style={{
          backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
          backgroundSize: '30px 30px',
        }}
      />
      {/* Subtle radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-emerald-700/30 via-transparent to-transparent" />

      <div className="relative max-w-6xl mx-auto px-4 py-14 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          {/* Left: title + image + CTA */}
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left">

            {/* Headline */}
            <motion.h1 {...fadeUp(0)} className="text-4xl md:text-5xl font-extrabold text-white leading-[1.08] tracking-tight mb-4">
              ¿No te respetan{' '}
              <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
                como consumidor?
              </span>
            </motion.h1>

            {/* Badge */}
            <motion.div {...fadeUp(0.1)} className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-emerald-300 text-xs font-semibold px-4 py-2 rounded-full mb-5 border border-white/20 self-center lg:self-start">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              Diagnóstico inmediato con IA
              <span className="bg-emerald-400/20 text-emerald-300 text-[10px] px-2 py-0.5 rounded-full font-bold ml-1">
                GRATIS
              </span>
            </motion.div>

            {/* Subtitle */}
            <motion.p {...fadeUp(0.18)} className="text-lg text-emerald-100/80 max-w-sm mb-4 leading-relaxed mx-auto lg:mx-0">
              Entendé tus derechos y actuá de inmediato.
            </motion.p>

            {/* Trust pills */}
            <motion.div {...fadeUp(0.24)} className="flex flex-wrap gap-2 justify-center lg:justify-start">
              <div className="flex items-center gap-1.5 bg-white/10 border border-white/20 rounded-full px-3 py-1.5">
                <span className="text-emerald-400 text-sm">⚡</span>
                <span className="text-sm font-medium text-white/80">Respuesta inmediata</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/10 border border-white/20 rounded-full px-3 py-1.5">
                <span className="text-emerald-400 text-sm">🔒</span>
                <span className="text-sm font-medium text-white/80">Confidencial</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/10 border border-white/20 rounded-full px-3 py-1.5">
                <span className="text-emerald-400 text-sm">✓</span>
                <span className="text-sm font-medium text-white/80">Análisis gratis</span>
              </div>
            </motion.div>

            {/* Lawyer image floating — transparent PNG, no box */}
            <motion.div
              {...fadeUp(0.28)}
              className="flex items-end justify-center lg:justify-start"
            >
              <div className="relative inline-block">
                <img
                  src="/lawyer-img.png"
                  alt="Abogada profesional"
                  className="h-[400px] w-auto object-contain object-bottom drop-shadow-[0_8px_40px_rgba(0,0,0,0.4)]"
                  style={{ marginBottom: '44px' }}
                />
                {/* WhatsApp button — same width as image, barely overlapping bottom */}
                <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center gap-1">
                  <a
                    href="https://wa.me/5493512852894"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center bg-[#25D366] hover:bg-[#20b858] text-white text-base font-bold px-10 py-3 rounded-full shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl w-full"
                  >
                    <svg className="w-5 h-5 mr-2 shrink-0" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.126.554 4.122 1.526 5.855L.057 23.882a.5.5 0 0 0 .606.656l6.257-1.643A11.94 11.94 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.894a9.878 9.878 0 0 1-5.034-1.378l-.36-.214-3.733.98.997-3.636-.235-.374A9.867 9.867 0 0 1 2.106 12C2.106 6.533 6.533 2.106 12 2.106S21.894 6.533 21.894 12 17.467 21.894 12 21.894z"/>
                    </svg>
                    Hablá con un abogado
                  </a>
                  <span className="text-xs text-white/60">Sin registro · Respondemos en minutos</span>
                </div>
              </div>
            </motion.div>

          </div>

          {/* Right: Real chat widget — stretches to match left column height */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
            className="flex justify-center items-stretch"
          >
            <div className="relative w-full max-w-md flex flex-col">
              {/* Glow halo */}
              <div className="absolute -inset-4 bg-gradient-to-r from-[var(--accent-9)]/20 to-[var(--teal-9)]/20 rounded-3xl blur-2xl pointer-events-none" />
              <div className="relative flex-1 min-h-[400px] overflow-hidden rounded-2xl shadow-2xl">
                <ChatWidget />
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
