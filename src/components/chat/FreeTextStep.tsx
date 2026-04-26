'use client';

import { useState } from 'react';

interface FreeTextStepProps {
  onSubmit: (text: string) => void;
  isLoading: boolean;
}

export function FreeTextStep({ onSubmit, isLoading }: FreeTextStepProps) {
  const [text, setText] = useState('');
  const [error, setError] = useState('');

  function handleSubmit() {
    if (text.trim().length < 10) {
      setError('Contanos un poco más sobre tu caso.');
      return;
    }
    setError('');
    onSubmit(text.trim());
  }

  return (
    <div className="flex flex-col gap-4 w-full max-w-lg mx-auto px-1 py-2">
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-semibold text-gray-900">Contanos qué pasó</h2>
        <p className="text-sm text-gray-500">
          Describí tu caso con el detalle que tengas. Cuanto más informes, menos preguntas adicionales
          necesitaremos.
        </p>
      </div>

      <textarea
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setError('');
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && e.metaKey) handleSubmit();
        }}
        placeholder="Ej: Mercado Libre no me entregó un paquete que compré en marzo. Reclamé por mail pero no me responden. Tengo la factura y los mails. El producto costó $80.000..."
        rows={5}
        disabled={isLoading}
        data-chat-input
        className="border border-gray-300 rounded-lg px-4 py-3 text-sm
          focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none
          disabled:opacity-50"
        autoFocus
      />

      {error && <p className="text-red-500 text-xs">{error}</p>}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={isLoading || text.trim().length < 10}
        className="bg-blue-600 text-white rounded-lg px-4 py-3 text-sm
          font-medium hover:bg-blue-700 transition-colors
          disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Analizando...' : 'Continuar →'}
      </button>

      <p className="text-xs text-gray-400 text-center">Podés escribir todo junto — detectamos automáticamente los datos.</p>
    </div>
  );
}
