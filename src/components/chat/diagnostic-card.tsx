'use client';

import { Scale, Info, ChevronRight, FileText, Clock, AlertTriangle } from 'lucide-react';
import type { GenerarDiagnosticoArgs } from '@/lib/ai/tools';
import { trackWhatsAppClick } from '@/lib/analytics';

const WHATSAPP_NUMBER = '5493512852894';

const areaLabels: Record<string, string> = {
  telecomunicaciones: 'Telecomunicaciones',
  financiero: 'Financiero',
  electrodomesticos: 'Electrodomésticos',
  ecommerce: 'E-commerce',
  seguros_prepaga: 'Seguros / Prepaga',
  servicios_publicos: 'Servicios Públicos',
  turismo_aereo: 'Turismo / Aéreo',
};

export function DiagnosticCard({ diagnostico }: { diagnostico: GenerarDiagnosticoArgs }) {
  const disclaimer = 'Este diagnóstico es orientativo y no constituye asesoramiento legal profesional. Un abogado matriculado evaluará los aspectos jurídicos de tu caso.';

  const waMessage = encodeURIComponent(
    `Hola! Quisiera que un abogado evalúe mi caso (${diagnostico.caso_id}). ${diagnostico.problema_principal}. Proveedor: ${diagnostico.proveedor}.`,
  );
  const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${waMessage}`;

  return (
    <div className="mt-2 rounded-xl border border-gray-200 bg-white p-4 shadow-sm" style={{ maxWidth: '100%' }}>
      {/* Header */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className="text-xs font-mono px-2 py-0.5 rounded bg-gray-100 text-gray-600">
          {diagnostico.caso_id}
        </span>
        <span
          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
          style={{ background: 'var(--accent-2)', color: 'var(--accent-11)' }}
        >
          {areaLabels[diagnostico.area] ?? diagnostico.area}
        </span>
        <span className="text-xs text-gray-500">{diagnostico.proveedor}</span>
      </div>

      {/* Problema principal */}
      <div className="mb-3">
        <p className="text-sm font-bold mb-1">Situación informada</p>
        <p className="text-sm text-gray-600">{diagnostico.problema_principal}</p>
      </div>

      {/* Detalles del caso */}
      <div className="mb-3 grid grid-cols-2 gap-2 text-xs">
        <div className="flex items-center gap-1.5 text-gray-600">
          <Clock size={12} />
          <span>{diagnostico.tiempo_del_problema}</span>
        </div>
        <div className="flex items-center gap-1.5 text-gray-600">
          <AlertTriangle size={12} />
          <span>
            {diagnostico.reclamo_previo.realizado
              ? diagnostico.reclamo_previo.con_numero_gestion
                ? `Reclamó (N° ${diagnostico.reclamo_previo.numero_gestion || 's/n'})`
                : 'Reclamó sin N° de gestión'
              : 'No reclamó aún'}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-gray-600">
          <span className="font-medium">Monto:</span>
          <span>{diagnostico.monto_declarado}</span>
        </div>
        {diagnostico.documentacion_disponible.length > 0 && (
          <div className="flex items-start gap-1.5 text-gray-600">
            <FileText size={12} className="mt-0.5 flex-shrink-0" />
            <span>{diagnostico.documentacion_disponible.join(', ')}</span>
          </div>
        )}
      </div>

      {/* Legislación aplicable */}
      <div className="mb-3">
        <div className="flex items-center gap-1 mb-1">
          <Scale size={14} style={{ color: 'var(--accent-9)' }} />
          <span className="text-sm font-bold">Normativa que podría aplicar</span>
        </div>
        <div className="flex flex-col gap-1">
          {diagnostico.legislacion_aplicable.map((ley, i) => (
            <span key={i} className="text-xs text-gray-500">
              • {ley}
            </span>
          ))}
        </div>
      </div>

      {/* Escenarios de resolución */}
      <div className="mb-3">
        <div className="flex items-center gap-1 mb-2">
          <Info size={13} style={{ color: 'var(--accent-9)' }} />
          <span className="text-sm font-bold">Vías de resolución (información general)</span>
        </div>
        <div className="flex flex-col gap-2">
          {diagnostico.escenarios_resolucion.map((escenario, i) => (
            <div key={i} className="flex gap-2 items-start">
              <span
                style={{
                  background: 'var(--accent-9)',
                  color: 'white',
                  borderRadius: '9999px',
                  width: '16px',
                  height: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  fontSize: '10px',
                  fontWeight: 'bold',
                  marginTop: '2px',
                }}
              >
                {i + 1}
              </span>
              <div>
                {escenario.url ? (
                  <a href={escenario.url} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-blue-500 underline hover:text-blue-700">{escenario.via}</a>
                ) : (
                  <span className="text-xs font-medium text-gray-700">{escenario.via}</span>
                )}
                <p className="text-xs text-gray-500">{escenario.descripcion}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Disclaimer */}
      <div
        className="mb-3 p-2"
        style={{
          background: 'var(--amber-2)',
          border: '1px solid var(--amber-5)',
          borderRadius: 'var(--radius-2)',
        }}
      >
        <span className="text-xs" style={{ color: 'var(--amber-11)', lineHeight: 1.45 }}>
          <strong>⚠️ Aviso importante:</strong> {disclaimer}
        </span>
      </div>

      {/* CTA */}
      <a
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackWhatsAppClick('diagnostic', diagnostico.caso_id)}
        className="flex items-center justify-center gap-2 w-full py-3 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[0.9375rem] rounded-xl no-underline transition-colors"
      >
        Consultar con un abogado (sin cargo inicial)
        <ChevronRight size={16} />
      </a>
    </div>
  );
}
