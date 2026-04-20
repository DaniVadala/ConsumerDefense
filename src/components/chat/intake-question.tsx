'use client';

import { useState } from 'react';

interface IntakeQuestionProps {
  pregunta: string;
  placeholder?: string;
  opciones: string[];
  tipoInput: 'seleccion' | 'texto_libre' | 'si_no';
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
  const [answered, setAnswered] = useState(false);

  const handleSelect = (text: string) => {
    if (!isActive || answered) return;
    setAnswered(true);
    onSelect(text);
  };

  const handleTextSubmit = () => {
    if (!textoLibre.trim() || !isActive || answered) return;
    setAnswered(true);
    onSelect(textoLibre.trim());
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

      {/* Opciones */}
      {(tipoInput === 'seleccion' || tipoInput === 'si_no') && (
        <div className="flex flex-wrap gap-2">
          {opciones.map((opcion) => (
            <button
              key={opcion}
              onClick={() => handleSelect(opcion)}
              disabled={!isActive || answered}
              className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
                answered || !isActive
                  ? 'border-gray-200 text-gray-400 bg-gray-50 cursor-default'
                  : 'border-emerald-300 text-emerald-700 bg-white hover:bg-emerald-50 cursor-pointer'
              }`}
            >
              {opcion}
            </button>
          ))}
        </div>
      )}

      {tipoInput === 'texto_libre' && (
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
    </div>
  );
}
