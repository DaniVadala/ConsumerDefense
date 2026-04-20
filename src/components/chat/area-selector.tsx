'use client';

interface AreaSelectorProps {
  areas: Array<{ key: string; label: string }>;
  onSelect: (area: { key: string; label: string }) => void;
}

export function AreaSelector({ areas, onSelect }: AreaSelectorProps) {
  return (
    <div className="mt-2 rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
      <p className="text-xs text-gray-500 mb-2 font-medium">Seleccioná el área de tu problema:</p>
      <div className="flex flex-wrap gap-2">
        {areas.map((area) => (
          <button
            key={area.key}
            onClick={() => onSelect(area)}
            className="text-xs font-medium px-3 py-1.5 rounded-full border border-emerald-300 text-emerald-700 bg-white hover:bg-emerald-50 transition-colors cursor-pointer"
          >
            {area.label}
          </button>
        ))}
      </div>
    </div>
  );
}
