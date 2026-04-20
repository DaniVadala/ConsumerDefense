'use client';

import { AlertTriangle, Phone, ExternalLink } from 'lucide-react';

interface UrgenciaWidgetProps {
  motivo: string;
  recurso: string;
  contacto?: string;
}

export function UrgenciaWidget({ motivo, recurso, contacto }: UrgenciaWidgetProps) {
  const isUrl = contacto?.startsWith('http');
  const isPhone = contacto && !isUrl;

  return (
    <div className="mt-2 rounded-xl border border-red-200 bg-red-50 p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle size={16} className="text-red-600 flex-shrink-0" />
        <p className="text-sm font-bold text-red-800">Caso urgente</p>
      </div>
      <p className="text-xs text-red-700 mb-3">{motivo}</p>

      <div className="rounded-lg bg-white border border-red-200 p-3">
        <p className="text-xs font-semibold text-gray-700 mb-1">Recurso de atención inmediata:</p>
        <p className="text-sm font-bold text-gray-900 mb-2">{recurso}</p>

        {contacto && (
          isUrl ? (
            <a
              href={contacto}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-blue-600 underline hover:text-blue-800"
            >
              <ExternalLink size={12} />
              Ir al sitio oficial
            </a>
          ) : isPhone ? (
            <a
              href={`tel:${contacto.replace(/\D/g, '')}`}
              className="inline-flex items-center gap-1.5 text-xs text-emerald-700 font-semibold"
            >
              <Phone size={12} />
              {contacto}
            </a>
          ) : null
        )}
      </div>
    </div>
  );
}
