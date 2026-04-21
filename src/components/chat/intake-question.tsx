'use client';

import { useState } from 'react';

interface IntakeQuestionProps {
  pregunta: string;
  placeholder?: string;
  opciones: string[];
  tipoInput: 'seleccion' | 'texto_libre' | 'si_no' | 'checklist';
  pasoActual: number;
  pasoTotal: number;
  onSelect: (text: string) => void;
  isActive: boolean;
}

export function IntakeQuestion({
  pregunta,
  placeholder,
  opciones,
  tipoInput,
  pasoActual,
  pasoTotal,
  onSelect,
  isActive,
}: IntakeQuestionProps) {
  const [textoLibre, setTextoLibre] = useState('');
  const [checked, setChecked] = useState<string[]>([]);
  const [answered, setAnswered] = useState(false);

  const handleTextSubmit = () => {
    if (!textoLibre.trim() || !isActive || answered) return;
    setAnswered(true);
    onSelect(textoLibre.trim());
  };

  const toggleCheck = (item: string) => {
    if (!isActive || answered) return;
    setChecked(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);
  };

  const handleChecklistSubmit = () => {
    if (!isActive || answered) return;
    setAnswered(true);
    onSelect(checked.join('|||'));
  };

  const progress = Math.round((pasoActual / pasoTotal) * 100);

  return (
    <div className="mt-2 rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
      {/* Progress */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progress}%`, background: 'var(--accent-9)' }}
          />
        </div>
        <span className="text-xs text-gray-400 flex-shrink-0">{pasoActual}/{pasoTotal}</span>
      </div>

      {/* Pregunta */}
      <p className="text-sm font-medium text-gray-800 mb-2">{pregunta}</p>

      {/* Texto libre (todos los tipos no-checklist) */}
      {tipoInput !== 'checklist' && (
        <div className="flex gap-2">
          <input
            type="text"
            value={textoLibre}
            onChange={(e) => setTextoLibre(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleTextSubmit()}
            disabled={!isActive || answered}
            placeholder={placeholder || 'Escribí tu respuesta...'}
            className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-1.5 outline-none focus:border-emerald-400 disabled:bg-gray-50 disabled:text-gray-400"
          />
          <button
            onClick={handleTextSubmit}
            disabled={!isActive || answered || !textoLibre.trim()}
            className="text-xs px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-medium disabled:opacity-40 cursor-pointer disabled:cursor-default"
          >
            OK
          </button>
        </div>
      )}

      {/* Checklist */}
      {tipoInput === 'checklist' && (
        <div className="flex flex-col gap-1.5">
          {opciones.map((opcion) => {
            const isChecked = checked.includes(opcion);
            return (
              <button
                key={opcion}
                onClick={() => toggleCheck(opcion)}
                disabled={!isActive || answered}
                className={`flex items-center gap-2 text-left text-xs px-3 py-2 rounded-lg border transition-colors ${
                  answered
                    ? isChecked
                      ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                      : 'border-gray-200 bg-gray-50 text-gray-400'
                    : isChecked
                    ? 'border-emerald-400 bg-emerald-50 text-emerald-700 cursor-pointer'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-emerald-200 hover:bg-emerald-50/40 cursor-pointer'
                }`}
              >
                <span className={`w-4 h-4 rounded flex-shrink-0 flex items-center justify-center border ${
                  isChecked ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300 bg-white'
                }`}>
                  {isChecked && (
                    <svg viewBox="0 0 10 8" className="w-2.5 h-2 fill-none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 4l2.5 2.5L9 1"/>
                    </svg>
                  )}
                </span>
                {opcion}
              </button>
            );
          })}
          {!answered && (
            <button
              onClick={handleChecklistSubmit}
              disabled={!isActive}
              className="mt-1 text-xs px-3 py-2 rounded-lg bg-emerald-600 text-white font-medium disabled:opacity-40 cursor-pointer disabled:cursor-default self-end"
            >
              {checked.length === 0 ? 'No tengo ninguna' : `Confirmar (${checked.length})`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
