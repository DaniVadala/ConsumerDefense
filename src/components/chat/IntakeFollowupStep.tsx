'use client';

import { useMemo, useState } from 'react';
import { Shield } from 'lucide-react';
import { useLocale } from '@/lib/i18n/context';
import type { ExtractedAnswers, StepKey } from '@/lib/chat/intake-extractor';
import { getPendingSteps } from '@/lib/chat/intake-extractor';
import { IntakeChatComposer } from '@/components/chat/intake-chat-composer';

function BotAvatar() {
  return (
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
      style={{ background: 'var(--accent-9)' }}
    >
      <Shield className="w-4 h-4 text-white" />
    </div>
  );
}

function formatStep4(value: string | null): string {
  if (value === 'si') return 'Sí';
  if (value === 'no') return 'No';
  if (value === 'no_recuerda') return 'No recuerda';
  return String(value);
}

type IntakeFollowupStepProps = {
  extracted: ExtractedAnswers;
  userRelato: string;
  onSubmit: (text: string) => Promise<boolean>;
  isLoading: boolean;
  inlineError: string | null;
};

export function IntakeFollowupStep({
  extracted,
  userRelato,
  onSubmit,
  isLoading,
  inlineError,
}: IntakeFollowupStepProps) {
  const { t } = useLocale();
  const [text, setText] = useState('');
  const [localError, setLocalError] = useState('');

  const pendingSteps = useMemo(() => getPendingSteps(extracted), [extracted]);
  const completedSteps = useMemo(() => {
    const all: StepKey[] = ['step1', 'step2', 'step3', 'step4', 'step5', 'step6', 'step7', 'step8', 'step9'];
    return all.filter((k) => extracted[k] !== null && !pendingSteps.includes(k));
  }, [extracted, pendingSteps]);

  const labels = t.chat.intakeSteps;

  const missingSummary =
    pendingSteps.length === 0
      ? null
      : pendingSteps.length === 1
        ? t.chat.followupMissingOne
        : t.chat.followupMissingMany.replace('{count}', String(pendingSteps.length));

  const trimmed = text.trim();
  const canSubmit = trimmed.length >= 3;

  async function handleSend() {
    if (!canSubmit) {
      setLocalError(t.chat.followupEmptyError);
      return;
    }
    setLocalError('');
    const ok = await onSubmit(trimmed);
    if (ok) setText('');
  }

  return (
    <div className="flex flex-col gap-4 w-full max-w-lg mx-auto px-1 py-2">
      <div className="flex justify-end">
        <div className="bg-blue-600 text-white rounded-2xl rounded-br-sm px-4 py-3 text-base sm:text-sm max-w-[90%] leading-relaxed shadow-sm">
          {userRelato}
        </div>
      </div>

      <div className="flex items-end gap-2">
        <BotAvatar />
        <div
          className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 text-base sm:text-sm max-w-[90%] leading-relaxed shadow-sm"
          style={{ border: '1px solid var(--slate-4)', color: 'var(--slate-12)' }}
        >
          <p className="font-medium text-slate-900 mb-2">{t.chat.followupIntro}</p>
          {completedSteps.length > 0 ? (
            <ul className="list-disc pl-5 space-y-1 mb-3 text-slate-700">
              {completedSteps.map((key) => (
                <li key={key}>
                  <span className="font-medium text-slate-800">{labels[key]}:</span>{' '}
                  {key === 'step4' ? formatStep4(extracted.step4) : String(extracted[key])}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mb-3 text-slate-700">{t.chat.followupNothingDetected}</p>
          )}

          {pendingSteps.length > 0 && (
            <div className="mb-3">
              <p className="text-slate-800 font-medium mb-1">
                {t.chat.followupMissingLead}{' '}
                <span className="font-semibold text-emerald-800">{missingSummary}</span>
              </p>
              <ul className="list-disc pl-5 space-y-0.5 text-slate-700">
                {pendingSteps.map((key) => (
                  <li key={key}>{labels[key]}</li>
                ))}
              </ul>
            </div>
          )}

          <p className="text-slate-600 text-base sm:text-sm">{t.chat.followupInvite}</p>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <IntakeChatComposer
          value={text}
          onChange={(v) => {
            setText(v);
            setLocalError('');
          }}
          onSubmit={() => void handleSend()}
          placeholder={t.chat.followupPlaceholder}
          sendAriaLabel={t.chat.followupSend}
          disabled={isLoading}
          canSubmit={canSubmit}
          isLoading={isLoading}
          minHeightClass="min-h-[100px]"
          rows={4}
          hint={t.chat.intakeComposerHint}
        />
        {(localError || inlineError) && (
          <p className="text-red-500 text-sm sm:text-xs text-center">{localError || inlineError}</p>
        )}
      </div>
    </div>
  );
}
