'use client';

import { useId } from 'react';

type AiThinkingLoaderProps = {
  label: string;
};

/**
 * Anillo con gradiente en rotación: sensación de “asistente analizando”,
 * sin barras de ecualizador ni decoración vistosa.
 */
export function AiThinkingLoader({ label }: AiThinkingLoaderProps) {
  const uid = useId().replace(/:/g, '');
  const gradId = `ai-loader-grad-${uid}`;

  return (
    <div
      className="flex flex-col items-center justify-center gap-5 py-8 px-4"
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <div
        className="relative flex h-14 w-14 items-center justify-center [perspective:120px]"
        aria-hidden
      >
        <svg
          className="absolute h-14 w-14"
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle
            cx="20"
            cy="20"
            r="16"
            className="stroke-slate-200"
            strokeWidth="2.5"
          />
        </svg>
        <svg
          className="absolute h-14 w-14 origin-center animate-[loader-spin_1.3s_linear_infinite]"
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient
              id={gradId}
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#0d9488" stopOpacity="0.15" />
              <stop offset="50%" stopColor="#059669" stopOpacity="1" />
              <stop offset="100%" stopColor="#2dd4bf" stopOpacity="0.2" />
            </linearGradient>
          </defs>
          <circle
            cx="20"
            cy="20"
            r="16"
            stroke={`url(#${gradId})`}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray="26 100"
            pathLength="100"
            fill="none"
          />
        </svg>
        <span
          className="absolute h-1.5 w-1.5 rounded-full bg-emerald-600/35 shadow-[0_0_10px_rgba(5,150,105,0.4)] [animation:loader-core_1.8s_ease-in-out_infinite]"
        />
      </div>
      <p className="text-sm text-center text-slate-500 max-w-[260px] leading-snug">
        {label}
      </p>
      <style>
        {`
          @keyframes loader-spin {
            to { transform: rotate(360deg); }
          }
          @keyframes loader-core {
            0%, 100% { transform: scale(0.88); opacity: 0.45; }
            50% { transform: scale(1.05); opacity: 0.95; }
          }
        `}
      </style>
    </div>
  );
}
