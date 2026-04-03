import { Header } from '@/components/header';
import { Hero } from '@/components/hero';
import { InfoSection } from '@/components/info-section';
import { Shield } from 'lucide-react';

export default function Home() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-white">
        <Hero />
        <InfoSection />

        {/* Compact footer */}
        <footer className="bg-gray-900 text-white py-6 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row items-center justify-between gap-3 mb-3">
              {/* Brand + links */}
              <div className="flex items-center gap-6 flex-wrap justify-center md:justify-start">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-gradient-to-br from-[var(--accent-9)] to-[var(--teal-9)] rounded-md flex items-center justify-center">
                    <Shield className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="font-bold text-sm">ReclamoBot</span>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <a href="#" className="hover:text-[var(--accent-9)] transition-colors">Política de privacidad</a>
                  <a href="#" className="hover:text-[var(--accent-9)] transition-colors">Términos de uso</a>
                  <a href="#" className="hover:text-[var(--accent-9)] transition-colors">Aviso legal</a>
                </div>
              </div>
              {/* Copyright */}
              <p className="text-xs text-gray-600 whitespace-nowrap">
                © {new Date().getFullYear()} ReclamoBot · Buenos Aires, Argentina
              </p>
            </div>
            {/* Legal disclaimer */}
            <p className="text-xs text-gray-600 leading-relaxed border-t border-gray-800 pt-3">
              <strong className="text-gray-500">Aviso legal:</strong> ReclamoBot es un servicio de
              orientación automatizada y no constituye asesoramiento legal profesional. La información
              proporcionada es de carácter informativo y no reemplaza la consulta con un abogado
              matriculado.
            </p>
          </div>
        </footer>
      </main>
    </>
  );
}
