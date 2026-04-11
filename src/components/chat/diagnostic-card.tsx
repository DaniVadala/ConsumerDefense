'use client';

import { Scale, AlertTriangle, CheckCircle, HelpCircle, ChevronRight, Info } from 'lucide-react';

interface DiagnosticData {
  diagnostic: true;
  category: string;
  provider: string;
  relevance: 'RELEVANTE' | 'REQUIERE ANÁLISIS' | 'FUERA DE ALCANCE';
  summary: string;
  applicableLaws: string[];
  legalContext: string;
  nextSteps: string[];
}

const WHATSAPP_NUMBER = '5493512852894';

const categoryLabels: Record<string, string> = {
  BANKING: 'Bancario',
  TELECOM: 'Telecomunicaciones',
  INSURANCE: 'Seguros',
  ECOMMERCE: 'E-commerce',
  APPLIANCES: 'Electrodomésticos',
  REAL_ESTATE: 'Inmobiliario',
  AUTOMOTIVE: 'Automotriz',
  OTHER: 'Otro',
};

const RELEVANCE_STYLES: Record<DiagnosticData['relevance'], { bg: string; text: string; icon: typeof CheckCircle; label: string }> = {
  'RELEVANTE':        { bg: 'bg-teal-100 text-teal-800', text: 'Caso relevante', icon: CheckCircle },
  'REQUIERE ANÁLISIS':{ bg: 'bg-amber-100 text-amber-800', text: 'Requiere análisis profesional', icon: AlertTriangle },
  'FUERA DE ALCANCE': { bg: 'bg-gray-100 text-gray-700', text: 'Fuera del alcance de consumo', icon: HelpCircle },
} as Record<DiagnosticData['relevance'], { bg: string; text: string; icon: typeof CheckCircle; label: string }>;

function RelevanceBadge({ relevance }: { relevance: DiagnosticData['relevance'] }) {
  const cfg = RELEVANCE_STYLES[relevance];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bg}`}>
      <Icon size={11} />
      {cfg.text}
    </span>
  );
}

export function DiagnosticCard({ data }: { data: DiagnosticData }) {
  const waMessage = encodeURIComponent(
    `Hola! Quisiera que un abogado evalúe mi caso. Situación: ${data.summary}. Categoría: ${categoryLabels[data.category] ?? data.category}. Proveedor: ${data.provider}.`
  );
  const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${waMessage}`;

  return (
    <div className="mt-2 rounded-xl border border-gray-200 bg-white p-4 shadow-sm" style={{ maxWidth: '100%' }}>
      {/* Header badges */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <RelevanceBadge relevance={data.relevance} />
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs border border-gray-300 text-gray-600">
          {categoryLabels[data.category] ?? data.category}
        </span>
        <span className="text-xs text-gray-500">{data.provider}</span>
      </div>

      {/* Summary */}
      <div className="mb-3">
        <p className="text-sm font-bold mb-1">Situación informada</p>
        <span className="text-sm text-gray-500">{data.summary}</span>
      </div>

      {/* Applicable laws */}
      <div className="mb-3">
        <div className="flex items-center gap-1 mb-1">
          <Scale size={14} style={{ color: 'var(--accent-9)' }} />
          <span className="text-sm font-bold">Normativa que podría aplicar</span>
        </div>
        <div className="flex flex-col gap-1">
          {data.applicableLaws.map((law, i) => (
            <span key={i} className="text-xs text-gray-500">• {law}</span>
          ))}
        </div>
      </div>

      {/* Legal context */}
      <div className="mb-3 p-3" style={{ background: 'var(--accent-2)', borderRadius: 'var(--radius-2)' }}>
        <div className="flex items-center gap-1 mb-1">
          <Info size={13} style={{ color: 'var(--accent-9)' }} />
          <span className="text-xs font-bold text-emerald-700">Marco legal aplicable</span>
        </div>
        <span className="text-sm text-gray-500" style={{ lineHeight: 1.5 }}>{data.legalContext}</span>
      </div>

      {/* Next steps */}
      <div className="mb-3">
        <p className="text-sm font-bold mb-2">Pasos sugeridos</p>
        <div className="flex flex-col gap-2">
          {data.nextSteps.map((step, i) => (
            <div key={i} className="flex gap-2 items-start">
              <span style={{
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
              }}>
                {i + 1}
              </span>
              <span className="text-xs text-gray-500">{step}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="mb-3 p-2" style={{ background: 'var(--amber-2)', border: '1px solid var(--amber-5)', borderRadius: 'var(--radius-2)' }}>
        <span className="text-xs" style={{ color: 'var(--amber-11)', lineHeight: 1.45 }}>
          <strong>⚠️ Aviso importante:</strong> Esta orientación es de carácter general e informativo, basada en la legislación pública argentina. No constituye asesoramiento legal profesional, no reemplaza la consulta con un abogado matriculado y no garantiza un resultado determinado. Cada caso requiere evaluación individual por un profesional habilitado.
        </span>
      </div>

      {/* CTA */}
      <a
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full py-3 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[0.9375rem] rounded-xl no-underline transition-colors"
      >
        Consultar con un abogado (sin cargo inicial)
        <ChevronRight size={16} />
      </a>
    </div>
  );
}
