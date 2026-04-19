'use client';

import { useState } from 'react';
import { Send } from 'lucide-react';
import { ProgressBar } from './progress-bar';
import { trackChatIntakeAnswer } from '@/lib/analytics';

interface IntakeQuestionProps {
  pregunta: string;
  opciones: string[];
  paso_actual: number;
  paso_total: number;
  area_identificada?: string;
  onSelect: (text: string) => void;
  isActive: boolean;
}

export function IntakeQuestion({
  pregunta,
  opciones,
  paso_actual,
  paso_total,
  onSelect,
  isActive,
}: IntakeQuestionProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [showFreeInput, setShowFreeInput] = useState(false);
  const [freeText, setFreeText] = useState('');

  const handleChipClick = (opcion: string) => {
    if (!isActive || selected) return;
    if (opcion.toLowerCase() === 'otro') {
      setShowFreeInput(true);
      return;
    }
    setSelected(opcion);
    trackChatIntakeAnswer(paso_actual, paso_total);
    onSelect(opcion);
  };

  const handleFreeSubmit = () => {
    const text = freeText.trim();
    if (!text || !isActive) return;
    setSelected(text);
    setShowFreeInput(false);
    trackChatIntakeAnswer(paso_actual, paso_total);
    onSelect(text);
  };

  return (
    <div className="mt-2 rounded-xl border border-gray-200 bg-white p-4 shadow-sm" style={{ maxWidth: '100%' }}>
      <ProgressBar pasoActual={paso_actual} pasoTotal={paso_total} />

      <p className="text-sm font-medium mb-3" style={{ color: 'var(--slate-12)' }}>
        {pregunta}
      </p>

      <div className="flex flex-wrap gap-2">
        {opciones.map((opcion) => {
          const isSelected = selected === opcion;
          const isDisabled = !isActive || (selected !== null && !isSelected);

          return (
            <button
              key={opcion}
              onClick={() => handleChipClick(opcion)}
              disabled={isDisabled}
              className="text-sm px-3 py-1.5 rounded-full border transition-colors cursor-pointer disabled:cursor-default"
              style={{
                borderColor: isSelected ? 'var(--accent-9)' : 'var(--slate-6)',
                background: isSelected ? 'var(--accent-9)' : 'white',
                color: isSelected ? 'white' : 'var(--slate-11)',
                opacity: isDisabled && !isSelected ? 0.5 : 1,
              }}
            >
              {opcion}
            </button>
          );
        })}
      </div>

      {showFreeInput && !selected && (
        <div className="flex items-center gap-2 mt-3">
          <input
            type="text"
            value={freeText}
            onChange={(e) => setFreeText(e.target.value)}
            placeholder="Escribí tu respuesta..."
            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleFreeSubmit();
            }}
          />
          <button
            onClick={handleFreeSubmit}
            disabled={!freeText.trim()}
            className="w-8 h-8 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <Send size={12} />
          </button>
        </div>
      )}
    </div>
  );
}
