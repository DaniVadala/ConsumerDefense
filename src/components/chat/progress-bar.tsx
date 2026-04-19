'use client';

interface ProgressBarProps {
  pasoActual: number;
  pasoTotal: number;
}

export function ProgressBar({ pasoActual, pasoTotal }: ProgressBarProps) {
  const percentage = Math.round((pasoActual / pasoTotal) * 100);

  return (
    <div className="flex items-center gap-3 mb-2">
      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--slate-4)' }}>
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percentage}%`, background: 'var(--accent-9)' }}
        />
      </div>
      <span className="text-xs font-medium whitespace-nowrap" style={{ color: 'var(--slate-9)' }}>
        Paso {pasoActual} de {pasoTotal}
      </span>
    </div>
  );
}
