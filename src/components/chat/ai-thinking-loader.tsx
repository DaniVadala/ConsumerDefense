'use client';

import { Helix } from 'ldrs/react';
import 'ldrs/react/Helix.css';

type AiThinkingLoaderProps = {
  label: string;
};

/** Helix (LDRS) + una sola palabra de estado. */
export function AiThinkingLoader({ label }: AiThinkingLoaderProps) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-4 py-10 px-4"
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <Helix size={52} speed={2.25} color="#0d9488" />
      <p className="text-center text-sm font-medium tracking-wide text-slate-500">Pensando…</p>
    </div>
  );
}
