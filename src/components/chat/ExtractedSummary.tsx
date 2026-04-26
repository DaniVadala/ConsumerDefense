'use client';

import type { ExtractedAnswers, StepKey } from '@/lib/chat/intake-extractor';

const STEP_LABELS: Record<StepKey, string> = {
  step1: 'Descripción del hecho',
  step2: 'Empresa o proveedor',
  step3: 'Fecha o período',
  step4: 'Reclamo previo',
  step5: 'Medios del reclamo',
  step6: 'Respuesta de la empresa',
  step7: 'Provincia',
  step8: 'Monto',
  step9: 'Pruebas o constancias',
};

function formatStep4(value: string | null): string {
  if (value === 'si') return 'Sí';
  if (value === 'no') return 'No';
  if (value === 'no_recuerda') return 'No recuerda';
  return String(value);
}

interface ExtractedSummaryProps {
  extracted: ExtractedAnswers;
  pendingSteps: StepKey[];
  onContinue: () => void;
}

export function ExtractedSummary({ extracted, pendingSteps, onContinue }: ExtractedSummaryProps) {
  const completedSteps = (Object.keys(STEP_LABELS) as StepKey[]).filter(
    (k) => extracted[k] !== null && !pendingSteps.includes(k),
  );

  return (
    <div className="flex flex-col gap-4 w-full max-w-lg mx-auto px-1 py-2">
      {completedSteps.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex flex-col gap-2">
          <p className="text-sm font-medium text-green-800">✅ Detectamos estos datos en tu relato:</p>
          <ul className="flex flex-col gap-1">
            {completedSteps.map((key) => (
              <li key={key} className="text-sm text-green-700">
                <span className="font-medium">{STEP_LABELS[key]}:</span>{' '}
                {key === 'step4' ? formatStep4(extracted.step4) : String(extracted[key])}
              </li>
            ))}
          </ul>
        </div>
      )}

      {pendingSteps.length > 0 ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-gray-600">
            Solo{' '}
            {pendingSteps.length === 1
              ? 'necesitamos un dato más'
              : `necesitamos ${pendingSteps.length} datos más`}{' '}
            para generar tu análisis.
          </p>
          <button
            type="button"
            onClick={onContinue}
            className="bg-blue-600 text-white rounded-lg px-4 py-3 text-sm
              font-medium hover:bg-blue-700 transition-colors"
          >
            Completar →
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-gray-600">Tenemos toda la información necesaria para tu análisis.</p>
          <button
            type="button"
            onClick={onContinue}
            className="bg-blue-600 text-white rounded-lg px-4 py-3 text-sm
              font-medium hover:bg-blue-700 transition-colors"
          >
            Ver análisis →
          </button>
        </div>
      )}
    </div>
  );
}
