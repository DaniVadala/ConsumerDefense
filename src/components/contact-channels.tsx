'use client';

import { useState } from 'react';
import { MessageCircle, Mail, User } from 'lucide-react';
import { LeadForm } from './lead-form';

const WHATSAPP_NUMBER = '5493512852894';
const CONTACT_EMAIL = 'summalegales@gmail.com';

export function ContactChannels() {
  const [formOpen, setFormOpen] = useState(false);

  const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hola! Tengo un problema de consumo y quiero orientación')}`;
  const mailUrl = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('Consulta DefensaYa')}&body=${encodeURIComponent('Hola, tengo un problema de consumo...')}`;

  return (
    <section className="py-20 px-4 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-gray-200 text-gray-600 text-xs font-semibold px-4 py-2 rounded-full mb-4">
            Múltiples canales
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3 tracking-tight">
            ¿Preferís otro canal?
          </h2>
          <p className="text-gray-500 text-base max-w-md mx-auto">
            Contactanos por donde te resulte más cómodo. Respondemos en minutos.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* WhatsApp card */}
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col items-center text-center p-6 bg-[#25D366] rounded-2xl shadow-md shadow-green-200/50 hover:shadow-xl hover:shadow-green-200 hover:-translate-y-1 transition-all duration-300 text-white"
          >
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <MessageCircle className="w-7 h-7 text-white fill-white" />
            </div>
            <h3 className="font-bold text-base mb-1">WhatsApp</h3>
            <p className="text-green-100 text-sm leading-relaxed">
              Chateá con nosotros directamente. Respuesta en minutos.
            </p>
          </a>

          {/* Email card */}
          <a
            href={mailUrl}
            className="group flex flex-col items-center text-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl shadow-sm hover:shadow-xl hover:shadow-blue-100 hover:-translate-y-1 transition-all duration-300"
          >
            <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-md shadow-blue-200">
              <Mail className="w-7 h-7 text-white" />
            </div>
            <h3 className="font-bold text-base text-gray-900 mb-1">Email</h3>
            <p className="text-gray-500 text-sm leading-relaxed">
              Mandanos tu consulta y te respondemos con el análisis completo.
            </p>
          </a>

          {/* Lead form card */}
          <button
            onClick={() => setFormOpen(true)}
            className="group flex flex-col items-center text-center p-6 bg-[var(--accent-2)] border border-[var(--accent-4)] rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
          >
            <div className="w-14 h-14 bg-gradient-to-br from-[var(--accent-9)] to-[var(--teal-9)] rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-md shadow-[var(--accent-4)]">
              <User className="w-7 h-7 text-white" />
            </div>
            <h3 className="font-bold text-base text-gray-900 mb-1">Dejá tus datos</h3>
            <p className="text-gray-500 text-sm leading-relaxed">
              Te llamamos nosotros. Un especialista se pone en contacto con vos.
            </p>
          </button>
        </div>

        <LeadForm open={formOpen} onOpenChange={setFormOpen} />
      </div>
    </section>
  );
}
