'use client';

import { Scale, Info, Clock, AlertTriangle, ShieldCheck, ChevronRight, TrendingUp, Zap } from 'lucide-react';
import type { DiagnosticoData } from '@/lib/chatbot/state';
import { trackWhatsAppClick } from '@/lib/analytics';
import { useLocale } from '@/lib/i18n/context';

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '5493515284074';

const ESCENARIOS_ES = [
  {
    via: 'Reclamo administrativo',
    descripcion: 'Ventanilla Única Federal (online y gratuito) o, en Córdoba, Dirección Provincial de Defensa del Consumidor / OMIC Municipal.',
    url: 'https://www.argentina.gob.ar/servicio/iniciar-un-reclamo-ante-defensa-del-consumidor',
  },
  {
    via: 'Mediación / conciliación',
    descripcion: 'Sistema COPREC u otros mecanismos de conciliación previa. Un tercero neutral facilita un acuerdo.',
    url: null,
  },
  {
    via: 'Vía judicial',
    descripcion: 'Acción legal con abogado matriculado. Aplicable si las vías previas no resolvieron.',
    url: null,
  },
];

const ESCENARIOS_EN = [
  {
    via: 'Administrative complaint',
    descripcion: 'Federal Single Window (online and free) or, in Córdoba, the Provincial Consumer Protection Agency / Municipal OMIC.',
    url: 'https://www.argentina.gob.ar/servicio/iniciar-un-reclamo-ante-defensa-del-consumidor',
  },
  {
    via: 'Mediation / conciliation',
    descripcion: 'COPREC system or other pre-litigation conciliation mechanisms. A neutral third party facilitates an agreement.',
    url: null,
  },
  {
    via: 'Legal action',
    descripcion: 'Formal legal action with a licensed attorney. Applicable if prior channels did not resolve the issue.',
    url: null,
  },
];

const UI_ES = {
  preliminaryBadge: 'Diagnóstico preliminar',
  situacion: 'Situación informada',
  hecho: 'Hecho:',
  monto: 'Monto:',
  reclamoPrevio: 'Reclamo previo:',
  reclamoSi: (detalle?: string) => `Sí${detalle ? ` — ${detalle}` : ''}`,
  reclamoNo: 'No reclamó aún (recomendable antes de escalar)',
  refinarTitulo: 'Para refinar el diagnóstico faltaría:',
  refinarFooter: 'El abogado puede completar esta info en la conversación inicial.',
  docEstado: 'Estado de tu documentación',
  docSugerimos: 'Te sugerimos reunir:',
  normativa: 'Normativa que podría aplicar',
  vias: 'Vías de resolución (información general)',
  encuadre: 'Para encuadrar tu caso',
  aviso: '⚠️ Aviso importante:',
  proximoPaso: '¿Qué pasa al tocar el botón?',
  ctaUrgente: 'Hablar con un abogado YA (sin cargo inicial)',
  ctaNormal: 'Consultar con un abogado (sin cargo inicial)',
  urgenciaCritica: 'Situación crítica: conviene actuar sin demora.',
  urgenciaAlta: 'Situación con urgencia temporal o económica.',
  waMsg: (casoId: string, problema: string, proveedor: string, esPreliminar?: boolean) =>
    `Hola! Quisiera que un abogado evalúe mi caso (${casoId}). ${problema}. Proveedor: ${proveedor}.${esPreliminar ? ' (Diagnóstico preliminar — falta completar algunos datos.)' : ''}`,
};

const UI_EN = {
  preliminaryBadge: 'Preliminary diagnosis',
  situacion: 'Reported situation',
  hecho: 'Date/time:',
  monto: 'Amount:',
  reclamoPrevio: 'Prior complaint:',
  reclamoSi: (detalle?: string) => `Yes${detalle ? ` — ${detalle}` : ''}`,
  reclamoNo: 'No prior complaint (recommended before escalating)',
  refinarTitulo: 'To refine the diagnosis, the following info is still needed:',
  refinarFooter: 'The lawyer can gather this info during the initial conversation.',
  docEstado: 'Documentation status',
  docSugerimos: 'We suggest gathering:',
  normativa: 'Potentially applicable regulations',
  vias: 'Resolution paths (general information)',
  encuadre: 'Context for your case',
  aviso: '⚠️ Important notice:',
  proximoPaso: 'What happens when you tap the button?',
  ctaUrgente: 'Talk to a lawyer NOW (no upfront fee)',
  ctaNormal: 'Consult a lawyer (no upfront fee)',
  urgenciaCritica: 'Critical situation: it is advisable to act without delay.',
  urgenciaAlta: 'Time-sensitive or financially urgent situation.',
  waMsg: (casoId: string, problema: string, proveedor: string, esPreliminar?: boolean) =>
    `Hello! I'd like a lawyer to review my case (${casoId}). ${problema}. Provider: ${proveedor}.${esPreliminar ? ' (Preliminary diagnosis — some data still missing.)' : ''}`,
};

export function DiagnosticCard({ data }: { data: DiagnosticoData }) {
  const { lang } = useLocale();
  const ui = lang === 'en' ? UI_EN : UI_ES;
  const escenarios = lang === 'en' ? ESCENARIOS_EN : ESCENARIOS_ES;

  const waMessage = encodeURIComponent(ui.waMsg(data.casoId, data.problemaPrincipal, data.proveedor, data.esPreliminar));
  const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${waMessage}`;

  const esUrgente = data.nivelUrgencia === 'critica' || data.nivelUrgencia === 'alta';

  return (
    <div className="mt-2 rounded-xl border border-gray-200 bg-white p-4 shadow-sm" style={{ maxWidth: '100%' }}>
      {/* Banner de urgencia */}
      {esUrgente && (
        <div className="mb-3 flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2">
          <Zap size={14} className="text-amber-700 flex-shrink-0" />
          <span className="text-xs font-medium text-amber-900">
            {data.nivelUrgencia === 'critica' ? ui.urgenciaCritica : ui.urgenciaAlta}
          </span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className="text-xs font-mono px-2 py-0.5 rounded bg-gray-100 text-gray-600">
          {data.casoId}
        </span>
        <span
          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
          style={{ background: 'var(--accent-2)', color: 'var(--accent-11)' }}
        >
          {data.area}
        </span>
        <span className="text-xs text-gray-500">{data.proveedor}</span>
        {data.esPreliminar && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
            {ui.preliminaryBadge}
          </span>
        )}
      </div>

      {/* Situación */}
      <div className="mb-3">
        <p className="text-sm font-bold mb-1">{ui.situacion}</p>
        <p className="text-sm text-gray-600">{data.problemaPrincipal}</p>
      </div>

      {/* Detalles */}
      <div className="mb-3 flex flex-col gap-1.5 text-xs">
        <div className="flex items-center gap-1.5 text-gray-600">
          <Clock size={12} className="flex-shrink-0" />
          <span><strong>{ui.hecho}</strong> {data.tiempo}</span>
        </div>
        {data.monto && (
          <div className="flex items-center gap-1.5 text-gray-600">
            <span className="flex-shrink-0">💰</span>
            <span><strong>{ui.monto}</strong> {data.monto}</span>
          </div>
        )}
        <div className="flex items-start gap-1.5 text-gray-600">
          <AlertTriangle size={12} className="flex-shrink-0 mt-0.5" />
          <span>
            <strong>{ui.reclamoPrevio}</strong>{' '}
            {data.reclamoPrevio.realizado
              ? ui.reclamoSi(data.detalleReclamo)
              : ui.reclamoNo}
          </span>
        </div>
      </div>

      {/* Si es preliminar: qué falta */}
      {data.esPreliminar && data.camposFaltantes && data.camposFaltantes.length > 0 && (
        <div className="mb-3 p-2 rounded-lg bg-blue-50 border border-blue-100">
          <p className="text-xs font-semibold text-blue-900 mb-1">{ui.refinarTitulo}</p>
          <ul className="text-xs text-blue-800 list-disc pl-4">
            {data.camposFaltantes.map((c, i) => <li key={i}>{c}</li>)}
          </ul>
          <p className="text-[11px] text-blue-700 mt-1">{ui.refinarFooter}</p>
        </div>
      )}

      {/* Fortaleza documental */}
      <div className="mb-3">
        <div className="flex items-center gap-1 mb-1">
          <ShieldCheck size={14} style={{ color: 'var(--accent-9)' }} />
          <span className="text-sm font-bold">{ui.docEstado}</span>
        </div>
        <p className="text-xs text-gray-600">{data.fortalezaDocumental}</p>
        {data.documentacionSugerida.length > 0 && (
          <div className="mt-1">
            <p className="text-xs text-gray-500 mb-0.5">{ui.docSugerimos}</p>
            <ul className="text-xs text-gray-500 list-disc pl-4">
              {data.documentacionSugerida.map((doc, i) => (
                <li key={i}>{doc}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Legislación */}
      <div className="mb-3">
        <div className="flex items-center gap-1 mb-1">
          <Scale size={14} style={{ color: 'var(--accent-9)' }} />
          <span className="text-sm font-bold">{ui.normativa}</span>
        </div>
        <div className="flex flex-col gap-1">
          {data.legislacionAplicable.map((ley, i) => (
            <span key={i} className="text-xs text-gray-500">• {ley}</span>
          ))}
        </div>
      </div>

      {/* Vías de resolución */}
      <div className="mb-3">
        <div className="flex items-center gap-1 mb-2">
          <Info size={13} style={{ color: 'var(--accent-9)' }} />
          <span className="text-sm font-bold">{ui.vias}</span>
        </div>
        <div className="flex flex-col gap-2">
          {escenarios.map((escenario, i) => (
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
                  <a href={escenario.url} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-blue-500 underline hover:text-blue-700">
                    {escenario.via}
                  </a>
                ) : (
                  <span className="text-xs font-medium text-gray-700">{escenario.via}</span>
                )}
                <p className="text-xs text-gray-500">{escenario.descripcion}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats de encuadre */}
      {data.stats && data.stats.length > 0 && (
        <div className="mb-3 p-2 rounded-lg bg-emerald-50 border border-emerald-100">
          <div className="flex items-center gap-1 mb-1">
            <TrendingUp size={13} className="text-emerald-700" />
            <span className="text-xs font-bold text-emerald-900">{ui.encuadre}</span>
          </div>
          {data.stats.map((s, i) => (
            <p key={i} className="text-xs text-emerald-800 mb-0.5">
              • {s.frase} <span className="text-[10px] text-emerald-700">({s.fuente}, {s.anio})</span>
            </p>
          ))}
        </div>
      )}

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
          <strong>{ui.aviso}</strong> {data.disclaimer}
        </span>
      </div>

      {/* Próximo paso */}
      {data.proximoPaso && (
        <div className="mb-2 text-xs text-gray-500 leading-snug">
          <strong className="text-gray-700">{ui.proximoPaso}</strong><br />
          {data.proximoPaso}
        </div>
      )}

      {/* CTA */}
      <a
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackWhatsAppClick('diagnostic_card', data.casoId)}
        className={`flex items-center justify-center gap-2 w-full py-3 px-5 text-white font-semibold text-[0.9375rem] rounded-xl no-underline transition-colors ${
          esUrgente ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-600 hover:bg-emerald-700'
        }`}
      >
        {esUrgente ? ui.ctaUrgente : ui.ctaNormal}
        <ChevronRight size={16} />
      </a>
    </div>
  );
}
