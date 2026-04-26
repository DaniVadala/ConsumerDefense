'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import type { ExtractedAnswers, StepKey } from '@/lib/chat/intake-extractor';
import { getPendingSteps, mergeAnswers } from '@/lib/chat/intake-extractor';

// ---------------------------------------------------------------------------
// Configuración de steps
// ---------------------------------------------------------------------------

interface StepConfig {
  key: StepKey;
  question: string;
  type: 'text' | 'textarea' | 'pills_single' | 'pills_single_step4' | 'pills_multi' | 'province' | 'amount';
  options?: Array<{ id: string; label: string }>;
  placeholder?: string;
  minLength?: number;
  /** Pills con opción "sin pruebas" excluyente (step9) */
  evidencePills?: boolean;
  /** Texto del botón principal (pills multi o monto) */
  primaryCtaLabel?: string;
}

const STEP_CONFIGS: Record<StepKey, StepConfig> = {
  step1: {
    key: 'step1',
    question: '¿Qué pasó? Describí brevemente el problema.',
    type: 'textarea',
    placeholder: 'Ej: Me cancelaron el vuelo sin aviso...',
    minLength: 10,
  },
  step2: {
    key: 'step2',
    question: '¿Qué empresa o proveedor está involucrado?',
    type: 'text',
    placeholder: 'Ej: Aerolíneas Argentinas, Banco Galicia...',
  },
  step3: {
    key: 'step3',
    question: '¿Cuándo ocurrió aproximadamente?',
    type: 'text',
    placeholder: 'Ej: Abril 2025, hace dos meses...',
  },
  step4: {
    key: 'step4',
    question: '¿Hiciste algún reclamo previo?',
    type: 'pills_single_step4',
    options: [
      { id: 'si', label: 'Sí, reclamé' },
      { id: 'no', label: 'No reclamé' },
      { id: 'no_recuerda', label: 'No recuerdo' },
    ],
  },
  step5: {
    key: 'step5',
    question: '¿Por qué medios reclamaste?',
    type: 'pills_multi',
    options: [
      { id: 'mail', label: 'Mail' },
      { id: 'whatsapp', label: 'WhatsApp' },
      { id: 'telefono', label: 'Teléfono' },
      { id: 'presencial', label: 'Presencial' },
      { id: 'omic', label: 'OMIC' },
      { id: 'coprec', label: 'COPREC' },
      { id: 'carta', label: 'Carta documento' },
      { id: 'verbal', label: 'Solo verbal' },
    ],
  },
  step6: {
    key: 'step6',
    question: '¿Qué te respondió la empresa?',
    type: 'pills_single',
    options: [
      { id: 'no_respondio', label: 'No respondió' },
      { id: 'rechazo', label: 'Rechazó el reclamo' },
      { id: 'parcial', label: 'Ofreció solución parcial' },
      { id: 'tardo', label: 'Resolvió pero tardó mucho' },
      { id: 'otra', label: 'Otra respuesta' },
    ],
  },
  step7: {
    key: 'step7',
    question: '¿En qué provincia harías el reclamo?',
    type: 'province',
  },
  step8: {
    key: 'step8',
    question: '¿Cuál es el monto aproximado del daño o reclamo?',
    type: 'amount',
    placeholder: 'Ej: 150000',
    primaryCtaLabel: 'Continuar →',
  },
  step9: {
    key: 'step9',
    question: '¿Qué pruebas o constancias tenés? (Podés marcar varias.)',
    type: 'pills_multi',
    evidencePills: true,
    primaryCtaLabel: 'Generar análisis →',
    options: [
      { id: 'comprobante', label: 'Comprobante / factura' },
      { id: 'mails', label: 'Mails o mensajes' },
      { id: 'contrato', label: 'Contrato o términos' },
      { id: 'fotos', label: 'Fotos o capturas' },
      { id: 'denuncia_omic', label: 'Denuncia u organismo' },
      { id: 'testigos', label: 'Testigos' },
      { id: 'otra_prueba', label: 'Otra prueba' },
      { id: 'sin_pruebas', label: 'No tengo aún / no aplica' },
    ],
  },
};

const PROVINCES = [
  'Buenos Aires',
  'CABA',
  'Catamarca',
  'Chaco',
  'Chubut',
  'Córdoba',
  'Corrientes',
  'Entre Ríos',
  'Formosa',
  'Jujuy',
  'La Pampa',
  'La Rioja',
  'Mendoza',
  'Misiones',
  'Neuquén',
  'Río Negro',
  'Salta',
  'San Juan',
  'San Luis',
  'Santa Cruz',
  'Santa Fe',
  'Santiago del Estero',
  'Tierra del Fuego',
  'Tucumán',
];

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------

interface IntakeFormProps {
  extracted: ExtractedAnswers;
  onComplete: (formAnswers: Partial<ExtractedAnswers>) => void;
}

export function IntakeForm({ extracted, onComplete }: IntakeFormProps) {
  const [formAnswers, setFormAnswers] = useState<Partial<ExtractedAnswers>>({});
  const [textInput, setTextInput] = useState('');
  const [multiSelected, setMultiSelected] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [amountCurrency, setAmountCurrency] = useState('ARS');
  const [answerCount, setAnswerCount] = useState(0);

  const merged = useMemo(() => mergeAnswers(extracted, formAnswers), [extracted, formAnswers]);
  const pending = useMemo(() => getPendingSteps(merged), [merged]);
  const currentKey = pending[0];
  const currentConfig = currentKey ? STEP_CONFIGS[currentKey] : undefined;

  const progressPercent = useMemo(() => {
    const p = pending.length;
    if (p === 0 && answerCount === 0) return 0;
    return Math.round(100 * (answerCount / Math.max(1, answerCount + p)));
  }, [answerCount, pending.length]);

  useEffect(() => {
    setTextInput('');
    setMultiSelected([]);
    setError('');
  }, [currentKey]);

  const advance = useCallback(
    (value: string | 'si' | 'no' | 'no_recuerda') => {
      if (!currentKey) return;
      const updated = { ...formAnswers, [currentKey]: value } as Partial<ExtractedAnswers>;
      setFormAnswers(updated);
      setTextInput('');
      setMultiSelected([]);
      setError('');
      setAnswerCount((c) => c + 1);

      const nextMerged = mergeAnswers(extracted, updated);
      const still = getPendingSteps(nextMerged);
      if (still.length === 0) {
        onComplete(updated);
      }
    },
    [currentKey, formAnswers, extracted, onComplete],
  );

  const handleTextSubmit = () => {
    if (!currentConfig) return;
    const val = textInput.trim();
    if (!val || (currentConfig.minLength && val.length < currentConfig.minLength)) {
      setError('Por favor escribí una respuesta más detallada.');
      return;
    }
    advance(val);
  };

  const handleMultiSubmit = () => {
    if (!currentKey || !currentConfig?.options) return;
    if (currentConfig.evidencePills) {
      if (multiSelected.includes('sin_pruebas')) {
        advance('No tengo pruebas documentadas aún o no aplica');
        return;
      }
      if (multiSelected.length === 0) {
        setError('Marcá al menos una opción o "No tengo aún / no aplica".');
        return;
      }
      const labels = currentConfig.options
        .filter((o) => multiSelected.includes(o.id) && o.id !== 'sin_pruebas')
        .map((o) => o.label)
        .join(', ');
      advance(labels);
      return;
    }
    if (multiSelected.length === 0) {
      setError('Seleccioná al menos una opción.');
      return;
    }
    const labels = currentConfig.options
      .filter((o) => multiSelected.includes(o.id))
      .map((o) => o.label)
      .join(', ');
    advance(labels);
  };

  const toggleMulti = (id: string) => {
    if (!currentConfig) return;
    if (currentConfig.evidencePills) {
      if (id === 'sin_pruebas') {
        setMultiSelected(['sin_pruebas']);
        return;
      }
      setMultiSelected((prev) => {
        const w = prev.filter((x) => x !== 'sin_pruebas');
        return w.includes(id) ? w.filter((x) => x !== id) : [...w, id];
      });
      return;
    }
    setMultiSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  if (!currentKey || !currentConfig) {
    return null;
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-lg mx-auto px-1 py-2">
      <div className="flex flex-col gap-1">
        <div className="flex justify-between text-xs text-gray-500">
          <span>
            Siguiente dato ({pending.length} {pending.length === 1 ? 'pendiente' : 'pendientes'})
          </span>
          <span>{progressPercent}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <p className="text-base font-medium text-gray-800">{currentConfig.question}</p>

      {currentConfig.type === 'textarea' && (
        <div className="flex flex-col gap-2">
          <textarea
            value={textInput}
            onChange={(e) => {
              setTextInput(e.target.value);
              setError('');
            }}
            placeholder={currentConfig.placeholder}
            rows={4}
            className="border border-gray-300 rounded-lg px-4 py-3 text-sm
              focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            autoFocus
          />
          {error && <p className="text-red-500 text-xs">{error}</p>}
          <button
            type="button"
            onClick={handleTextSubmit}
            className="bg-blue-600 text-white rounded-lg px-4 py-3 text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Continuar →
          </button>
        </div>
      )}

      {currentConfig.type === 'text' && (
        <div className="flex flex-col gap-2">
          <input
            type="text"
            value={textInput}
            onChange={(e) => {
              setTextInput(e.target.value);
              setError('');
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleTextSubmit()}
            placeholder={currentConfig.placeholder}
            className="border border-gray-300 rounded-lg px-4 py-3 text-sm
              focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
          {error && <p className="text-red-500 text-xs">{error}</p>}
          <button
            type="button"
            onClick={handleTextSubmit}
            className="bg-blue-600 text-white rounded-lg px-4 py-3 text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Continuar →
          </button>
        </div>
      )}

      {currentConfig.type === 'pills_single_step4' && (
        <div className="flex flex-col gap-2">
          {currentConfig.options!.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => advance(opt.id as 'si' | 'no' | 'no_recuerda')}
              className="border border-gray-300 rounded-lg px-4 py-3 text-sm
                text-left hover:bg-blue-50 hover:border-blue-400 transition-colors"
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {currentConfig.type === 'pills_single' && (
        <div className="flex flex-col gap-2">
          {currentConfig.options!.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => advance(opt.label)}
              className="border border-gray-300 rounded-lg px-4 py-3 text-sm
                text-left hover:bg-blue-50 hover:border-blue-400 transition-colors"
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {currentConfig.type === 'pills_multi' && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            {currentConfig.options!.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => toggleMulti(opt.id)}
                className={`border rounded-full px-4 py-2 text-sm transition-colors ${
                  multiSelected.includes(opt.id)
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'border-gray-300 text-gray-700 hover:border-blue-400'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {error && <p className="text-red-500 text-xs">{error}</p>}
          <button
            type="button"
            onClick={handleMultiSubmit}
            className="bg-blue-600 text-white rounded-lg px-4 py-3 text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            {currentConfig.primaryCtaLabel ?? 'Continuar →'}
          </button>
        </div>
      )}

      {currentConfig.type === 'province' && (
        <div className="flex flex-col gap-2">
          <select
            value={textInput}
            onChange={(e) => {
              setTextInput(e.target.value);
              setError('');
            }}
            className="border border-gray-300 rounded-lg px-4 py-3 text-sm
              focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          >
            <option value="">Seleccioná una provincia...</option>
            {PROVINCES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          {error && <p className="text-red-500 text-xs">{error}</p>}
          <button
            type="button"
            onClick={() => {
              if (!textInput) {
                setError('Seleccioná una provincia.');
                return;
              }
              advance(textInput);
            }}
            className="bg-blue-600 text-white rounded-lg px-4 py-3 text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Continuar →
          </button>
        </div>
      )}

      {currentConfig.type === 'amount' && (
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <select
              value={amountCurrency}
              onChange={(e) => setAmountCurrency(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-3 text-sm
                focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ARS">ARS $</option>
              <option value="USD">USD $</option>
            </select>
            <input
              type="number"
              value={textInput}
              onChange={(e) => {
                setTextInput(e.target.value);
                setError('');
              }}
              placeholder={currentConfig.placeholder}
              className="flex-1 border border-gray-300 rounded-lg px-4 py-3 text-sm
                focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>
          {error && <p className="text-red-500 text-xs">{error}</p>}
          <button
            type="button"
            onClick={() => {
              if (!textInput) {
                setError('Ingresá un monto aproximado.');
                return;
              }
              const n = Number(textInput);
              advance(`${amountCurrency} ${n.toLocaleString('es-AR')}`);
            }}
            className="bg-blue-600 text-white rounded-lg px-4 py-3 text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            {currentConfig.primaryCtaLabel ?? 'Ver análisis →'}
          </button>
          <button
            type="button"
            onClick={() => advance('No sabe el monto exacto')}
            className="text-gray-500 text-xs underline text-center"
          >
            No sé el monto exacto
          </button>
        </div>
      )}
    </div>
  );
}
