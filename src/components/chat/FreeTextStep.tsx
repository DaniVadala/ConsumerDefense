'use client';

import { useState } from 'react';
import { useLocale } from '@/lib/i18n/context';
import { IntakeChatComposer } from '@/components/chat/intake-chat-composer';

interface FreeTextStepProps {
  onSubmit: (text: string) => void;
  isLoading: boolean;
}

export function FreeTextStep({ onSubmit, isLoading }: FreeTextStepProps) {
  const { t } = useLocale();
  const [text, setText] = useState('');
  const [error, setError] = useState('');

  const trimmed = text.trim();
  const canSubmit = trimmed.length >= 10;

  function handleSubmit() {
    if (!canSubmit) {
      setError(t.chat.intakeFreeMinError);
      return;
    }
    setError('');
    onSubmit(trimmed);
  }

  return (
    <div className="flex flex-col gap-4 w-full max-w-lg mx-auto px-1 py-2">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg sm:text-base font-semibold text-gray-900">{t.chat.intakeFreeTitle}</h2>
        <p className="text-base sm:text-sm text-gray-500">{t.chat.intakeFreeSubtitle}</p>
      </div>

      <IntakeChatComposer
        value={text}
        onChange={(v) => {
          setText(v);
          setError('');
        }}
        onSubmit={handleSubmit}
        placeholder={t.chat.intakeFreePlaceholder}
        sendAriaLabel={t.chat.intakeFreeSend}
        disabled={isLoading}
        canSubmit={canSubmit}
        isLoading={isLoading}
        minHeightClass="min-h-[128px]"
        rows={5}
        hint={t.chat.intakeComposerHint}
      />

      {error && <p className="text-red-500 text-sm sm:text-xs">{error}</p>}

      <p className="text-sm sm:text-xs text-slate-400 text-center">{t.chat.intakeFreeHint}</p>
    </div>
  );
}
