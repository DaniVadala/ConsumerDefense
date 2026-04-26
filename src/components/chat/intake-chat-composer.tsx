'use client';

import type { KeyboardEvent } from 'react';
import { Send } from 'lucide-react';

type IntakeChatComposerProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder: string;
  sendAriaLabel: string;
  disabled: boolean;
  canSubmit: boolean;
  isLoading?: boolean;
  minHeightClass?: string;
  rows?: number;
  hint: string;
};

/**
 * Área de mensaje + envío alineado a chat: Enter envía, Mayús+Enter nueva línea.
 */
export function IntakeChatComposer({
  value,
  onChange,
  onSubmit,
  placeholder,
  sendAriaLabel,
  disabled,
  canSubmit,
  isLoading = false,
  minHeightClass = 'min-h-[100px]',
  rows = 4,
  hint,
}: IntakeChatComposerProps) {
  const busy = disabled || isLoading;

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key !== 'Enter') return;
    if (e.shiftKey) return;
    if (e.nativeEvent.isComposing) return;
    e.preventDefault();
    if (!busy && canSubmit) onSubmit();
  }

  return (
    <div className="flex flex-col gap-2">
      <div
        className="flex gap-1.5 items-end p-1.5 rounded-2xl border bg-white shadow-sm transition-all duration-200
          border-slate-200/90
          focus-within:border-blue-400/55 focus-within:shadow-md focus-within:ring-2 focus-within:ring-blue-500/20"
      >
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={rows}
          disabled={busy}
          data-chat-input
          className={`flex-1 w-0 ${minHeightClass} resize-none rounded-xl bg-transparent px-3 py-2.5 text-base sm:text-sm
            text-slate-800 placeholder:text-slate-400
            border-0 focus:outline-none focus:ring-0 disabled:opacity-55 leading-relaxed`}
        />
        <button
          type="button"
          onClick={() => {
            if (!busy && canSubmit) onSubmit();
          }}
          disabled={busy || !canSubmit}
          aria-label={sendAriaLabel}
          title={sendAriaLabel}
          className="group mb-0.5 mr-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full
            text-white shadow-md transition-all duration-200
            enabled:cursor-pointer enabled:hover:shadow-lg enabled:hover:scale-[1.04] enabled:active:scale-[0.98]
            disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
          style={{
            background: canSubmit && !busy
              ? 'linear-gradient(145deg, var(--accent-9, #0d9488), #2563eb)'
              : 'linear-gradient(145deg, #94a3b8, #64748b)',
          }}
        >
          <Send
            className={`h-5 w-5 transition-transform duration-200 ${canSubmit && !busy ? 'group-hover:translate-x-0.5 group-hover:-translate-y-px' : ''}`}
            strokeWidth={2.25}
            aria-hidden
          />
        </button>
      </div>
      <p className="text-[11px] sm:text-xs text-slate-400 text-center leading-snug">{hint}</p>
    </div>
  );
}
