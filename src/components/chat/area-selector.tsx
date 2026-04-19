'use client';

import { useState } from 'react';
import { trackChatAreaSelected } from '@/lib/analytics';

interface Area {
  id: string;
  label: string;
  descripcion: string;
  icono: string;
}

const AREAS: Area[] = [
  { id: 'telecomunicaciones', label: 'Telecomunicaciones', descripcion: 'Claro, Personal, Telecom, Fibertel', icono: '📡' },
  { id: 'financiero', label: 'Financiero', descripcion: 'Tarjetas, bancos, fintech', icono: '💳' },
  { id: 'electrodomesticos', label: 'Electrodomésticos', descripcion: 'Electrodomésticos, garantías', icono: '🔌' },
  { id: 'ecommerce', label: 'E-commerce', descripcion: 'MercadoLibre, Tiendanube, compras online', icono: '🛒' },
  { id: 'seguros_prepaga', label: 'Seguros / Prepaga', descripcion: 'Cobertura, prestaciones, siniestros', icono: '🏥' },
  { id: 'servicios_publicos', label: 'Servicios Públicos', descripcion: 'Gas, electricidad, agua', icono: '💡' },
  { id: 'turismo_aereo', label: 'Turismo / Aéreo', descripcion: 'Vuelos, paquetes turísticos', icono: '✈️' },
];

interface AreaSelectorProps {
  mensaje: string;
  onSelect: (text: string) => void;
  isActive: boolean;
}

export function AreaSelector({ mensaje, onSelect, isActive }: AreaSelectorProps) {
  const areas = AREAS;
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = (area: Area) => {
    if (!isActive || selected) return;
    setSelected(area.id);
    trackChatAreaSelected(area.label);
    onSelect(area.label);
  };

  return (
    <div className="mt-2 rounded-xl border border-gray-200 bg-white p-4 shadow-sm" style={{ maxWidth: '100%' }}>
      <p className="text-sm font-medium mb-3" style={{ color: 'var(--slate-12)' }}>
        {mensaje}
      </p>

      <div className="grid grid-cols-2 gap-2">
        {areas.map((area) => {
          const isSelected = selected === area.id;
          const isDisabled = !isActive || (selected !== null && !isSelected);

          return (
            <button
              key={area.id}
              onClick={() => handleSelect(area)}
              disabled={isDisabled}
              className="flex flex-col items-start gap-1 p-3 rounded-lg border text-left transition-colors cursor-pointer disabled:cursor-default"
              style={{
                borderColor: isSelected ? 'var(--accent-9)' : 'var(--slate-5)',
                background: isSelected ? 'var(--accent-2)' : 'white',
                opacity: isDisabled && !isSelected ? 0.5 : 1,
              }}
            >
              <span className="text-lg leading-none">{area.icono}</span>
              <span className="text-sm font-medium" style={{ color: 'var(--slate-12)' }}>
                {area.label}
              </span>
              <span className="text-xs leading-snug" style={{ color: 'var(--slate-9)' }}>
                {area.descripcion}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
