'use client';

import { useState, useEffect, useCallback } from 'react';
import { Shield } from 'lucide-react';
import { useLocale } from '@/lib/i18n/context';
import { useChatAvailability } from '@/lib/chat-availability-context';
import { trackChatMessageSent } from '@/lib/analytics';
import { FreeTextStep } from '@/components/chat/FreeTextStep';
import { IntakeFollowupStep } from '@/components/chat/IntakeFollowupStep';
import { ExtractedSummary } from '@/components/chat/ExtractedSummary';
import { IntakeForm } from '@/components/chat/IntakeForm';
import { AiThinkingLoader } from '@/components/chat/ai-thinking-loader';
import { DiagnosisMarkdownCard, isDiagnosisMarkdownContent } from '@/components/chat/diagnosis-markdown-card';
import { DiagnosisWhatsAppCta } from '@/components/chat/diagnosis-whatsapp-cta';
import {
  DIAGNOSIS_OUT_OF_SCOPE_SENTINEL,
  INTAKE_OR_OUTPUT_POLICY_MESSAGE,
} from '@/lib/chat/content-policy-messages';
import type { ExtractedAnswers } from '@/lib/chat/intake-extractor';
import {
  mergeAnswers,
  buildDiagnosisPrompt,
  getPendingSteps,
  buildWhatsAppHandoffMessage,
  buildWhatsAppCaseFactsBlock,
  WHATSAPP_HANDOFF_MAX_CHARS,
} from '@/lib/chat/intake-extractor';

const WA_MESSAGE_NO_CONDUENTE =
  'Hola DefensaYa, me costó explicar mi problema en el chat. ¿Pueden ayudarme con mi reclamo?';

function postDiagnosisWhatsAppMessage(
  diagnosis: string,
  caseSnapshot: ExtractedAnswers | null,
): string | undefined {
  if (diagnosis === INTAKE_OR_OUTPUT_POLICY_MESSAGE) {
    if (!caseSnapshot) return WA_MESSAGE_NO_CONDUENTE;
    const combined = `${WA_MESSAGE_NO_CONDUENTE}\n\n${buildWhatsAppCaseFactsBlock(caseSnapshot)}`;
    return combined.length > WHATSAPP_HANDOFF_MAX_CHARS
      ? `${combined.slice(0, WHATSAPP_HANDOFF_MAX_CHARS - 1)}…`
      : combined;
  }
  return caseSnapshot ? buildWhatsAppHandoffMessage(caseSnapshot) : undefined;
}

type Phase = 'followup' | 'summary' | 'form' | 'generating' | 'diagnosis' | 'blocked';

const EMPTY_EXTRACTED: ExtractedAnswers = {
  step1: null,
  step2: null,
  step3: null,
  step4: null,
  step5: null,
  step6: null,
  step7: null,
  step8: null,
  step9: null,
};

function useTypewriter(text: string, speed = 8) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);
  useEffect(() => {
    setDisplayed('');
    setDone(false);
    let i = 0;
    const id = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(id);
        setDone(true);
      }
    }, speed);
    return () => clearInterval(id);
  }, [text, speed]);
  return { displayed, done };
}

async function readDiagnosisFromLegacyChat(res: Response): Promise<string> {
  const ct = res.headers.get('content-type') ?? '';
  if (ct.includes('application/json')) {
    const j = (await res.json()) as { rateLimited?: boolean; text?: string; error?: string };
    if (j.rateLimited && j.text) {
      return `__RATE_LIMIT__:${j.text}`;
    }
    if (j.error) {
      return `__ERROR__:${j.error}`;
    }
    if (!res.ok) {
      return `__ERROR__:Error del servidor`;
    }
    return `__ERROR__:Respuesta inesperada`;
  }
  if (!res.ok) {
    return `__ERROR__:HTTP ${res.status}`;
  }
  const reader = res.body?.getReader();
  const decoder = new TextDecoder();
  let result = '';
  if (!reader) return '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    result += decoder.decode(value, { stream: true });
  }
  return result;
}

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

type IntakeFlowProps = {
  sessionId: string;
  bypassToken: string | undefined;
};

export function IntakeFlow({ sessionId, bypassToken }: IntakeFlowProps) {
  const { t } = useLocale();
  const { markConversationEnded, markRateLimited, markConversationEndedWithHeroWhatsApp } = useChatAvailability();
  const { displayed: welcomeText, done: welcomeDone } = useTypewriter(t.chat.welcome, 8);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [postExtractPhase, setPostExtractPhase] = useState<Phase | null>(null);
  const [extracted, setExtracted] = useState<ExtractedAnswers | null>(null);
  const [diagnosis, setDiagnosis] = useState('');
  /** Datos finales del intake (post-formulario) para prefijar WhatsApp con el relato. */
  const [caseSnapshot, setCaseSnapshot] = useState<ExtractedAnswers | null>(null);
  const [flowError, setFlowError] = useState<string | null>(null);
  const [policyMessage, setPolicyMessage] = useState<string | null>(null);
  const [relatoSnapshot, setRelatoSnapshot] = useState('');
  const [isFollowupLoading, setIsFollowupLoading] = useState(false);
  const [followupInlineError, setFollowupInlineError] = useState<string | null>(null);

  const intakeReady = welcomeDone && termsAccepted;

  const handleFreeTextSubmit = useCallback(
    async (text: string) => {
      setIsExtracting(true);
      setFlowError(null);
      setPostExtractPhase(null);
      setExtracted(null);
      setCaseSnapshot(null);
      setPolicyMessage(null);
      setRelatoSnapshot('');
      setFollowupInlineError(null);

      try {
        const res = await fetch('/api/intake-extract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text }),
        });

        const data = (await res.json().catch(() => ({}))) as {
          blocked?: boolean;
          message?: string;
          extracted?: ExtractedAnswers;
        };

        if (res.ok && data.blocked && typeof data.message === 'string') {
          setPolicyMessage(data.message);
          setPostExtractPhase('blocked');
          markConversationEndedWithHeroWhatsApp('no_conducente');
          return;
        }

        if (!res.ok) {
          setExtracted(EMPTY_EXTRACTED);
          setPostExtractPhase('summary');
          return;
        }

        if (data.extracted) {
          setExtracted(data.extracted);
          const pending = getPendingSteps(data.extracted);
          if (pending.length === 0) {
            setPostExtractPhase('summary');
          } else {
            setRelatoSnapshot(text.trim());
            setPostExtractPhase('followup');
          }
        } else {
          setExtracted(EMPTY_EXTRACTED);
          setPostExtractPhase('summary');
        }
      } catch (e) {
        console.error('Error extrayendo datos:', e);
        setExtracted(EMPTY_EXTRACTED);
        setPostExtractPhase('summary');
      } finally {
        setIsExtracting(false);
      }
    },
    [markConversationEndedWithHeroWhatsApp],
  );

  const handleFollowupSubmit = useCallback(
    async (msg: string): Promise<boolean> => {
      if (!extracted) return false;
      setFollowupInlineError(null);
      setIsFollowupLoading(true);
      try {
        const res = await fetch('/api/intake-followup-merge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ current: extracted, text: msg }),
        });

        const data = (await res.json().catch(() => ({}))) as {
          blocked?: boolean;
          message?: string;
          extracted?: ExtractedAnswers;
          error?: string;
        };

        if (res.ok && data.blocked && typeof data.message === 'string') {
          setPolicyMessage(data.message);
          setPostExtractPhase('blocked');
          markConversationEndedWithHeroWhatsApp('no_conducente');
          return false;
        }

        if (res.ok && data.extracted) {
          setExtracted(data.extracted);
          setPostExtractPhase('summary');
          return true;
        }

        const errMsg =
          typeof data.error === 'string' && data.error ? data.error : t.chat.followupMergeError;
        setFollowupInlineError(errMsg);
        return false;
      } catch (e) {
        console.error('Error en follow-up del intake:', e);
        setFollowupInlineError(t.chat.followupMergeError);
        return false;
      } finally {
        setIsFollowupLoading(false);
      }
    },
    [extracted, markConversationEndedWithHeroWhatsApp, t],
  );

  const generateDiagnosis = useCallback(
    async (extractedData: ExtractedAnswers, formAnswers: Partial<ExtractedAnswers>) => {
      setPostExtractPhase('generating');
      setFlowError(null);
      setDiagnosis('');

      const finalAnswers = mergeAnswers(extractedData, formAnswers);
      const prompt = buildDiagnosisPrompt(finalAnswers);

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: prompt,
            ...(bypassToken ? { bypassToken } : {}),
          }),
        });

        const text = await readDiagnosisFromLegacyChat(res);
        if (text.startsWith('__RATE_LIMIT__:')) {
          const msg = text.slice('__RATE_LIMIT__:'.length);
          markRateLimited();
          setFlowError(msg);
          setPostExtractPhase('summary');
          return;
        }
        if (text.startsWith('__ERROR__:')) {
          setFlowError(text.slice('__ERROR__:'.length));
          setPostExtractPhase('summary');
          return;
        }

        let out = text;
        if (text.trim() === DIAGNOSIS_OUT_OF_SCOPE_SENTINEL) {
          out = INTAKE_OR_OUTPUT_POLICY_MESSAGE;
          markConversationEndedWithHeroWhatsApp('no_conducente');
        } else {
          try {
            const mod = await fetch('/api/moderate-content', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ text: out }),
            });
            const mj = (await mod.json().catch(() => ({}))) as { flagged?: boolean };
            if (mj.flagged) {
              out = INTAKE_OR_OUTPUT_POLICY_MESSAGE;
              markConversationEndedWithHeroWhatsApp('no_conducente');
            } else {
              markConversationEnded();
            }
          } catch {
            markConversationEnded();
          }
        }

        setCaseSnapshot(finalAnswers);
        setDiagnosis(out);
        setPostExtractPhase('diagnosis');
        trackChatMessageSent(1);
      } catch (e) {
        console.error('Error generando diagnóstico:', e);
        setFlowError('No pudimos generar el análisis. Volvé a intentar.');
        setPostExtractPhase('summary');
      }
    },
    [bypassToken, markConversationEnded, markRateLimited, markConversationEndedWithHeroWhatsApp],
  );

  const handleSummaryContinue = useCallback(() => {
    if (!extracted) return;
    if (getPendingSteps(extracted).length === 0) {
      void generateDiagnosis(extracted, {});
    } else {
      setPostExtractPhase('form');
    }
  }, [extracted, generateDiagnosis]);

  const handleFormComplete = useCallback(
    (formAnswers: Partial<ExtractedAnswers>) => {
      if (extracted) void generateDiagnosis(extracted, formAnswers);
    },
    [extracted, generateDiagnosis],
  );

  useEffect(() => {
    const send = () => {
      if (document.visibilityState === 'hidden') {
        try {
          void navigator.sendBeacon(
            '/api/chat/abandon',
            JSON.stringify({ sessionId, lastStep: 'intake' }),
          );
        } catch {
          // ignore
        }
      }
    };
    document.addEventListener('visibilitychange', send);
    return () => document.removeEventListener('visibilitychange', send);
  }, [sessionId]);

  return (
    <div
      id="chat-widget"
      data-chat-widget
      className="flex flex-col h-full rounded-2xl overflow-hidden transition-shadow duration-300"
      style={{
        background: 'white',
        border: '1px solid var(--slate-4)',
        boxShadow: '0 20px 40px -12px rgb(0 0 0 / 0.12)',
      }}
    >
      <div
        className="flex items-center gap-3 px-5 py-4 flex-shrink-0 text-white"
        style={{ background: 'linear-gradient(135deg, var(--accent-9), var(--teal-9))' }}
      >
        <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center ring-2 ring-white/30">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="font-bold text-base sm:text-sm leading-tight">DefensaYa</p>
          <p className="text-white/80 text-sm sm:text-xs">{t.chat.subtitle}</p>
        </div>
        <div className="ml-auto flex items-center gap-2 rounded-full px-3 py-1" style={{ background: 'rgba(255,255,255,0.15)' }}>
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{ background: '#4ade80', animation: 'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite' }}
          />
          <span className="text-sm sm:text-xs text-white/90 font-medium">{t.chat.online}</span>
        </div>
      </div>

      <div
        className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-5"
        style={{ minHeight: 0, background: 'var(--slate-2)' }}
      >
        {flowError &&
          postExtractPhase !== 'diagnosis' &&
          postExtractPhase !== 'blocked' &&
          postExtractPhase !== 'followup' && (
          <div
            className="mb-4 rounded-xl border p-3 text-sm sm:text-xs leading-relaxed"
            style={{ background: '#fef2f2', borderColor: '#fecaca', color: '#991b1b' }}
            role="alert"
          >
            {flowError}
          </div>
        )}

        {postExtractPhase === null && !isExtracting && (
          <>
            <div className="flex items-end gap-2 mb-4">
              <BotAvatar />
              <div
                className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 text-base sm:text-sm max-w-[85%] leading-relaxed shadow-sm"
                style={{ border: '1px solid var(--slate-4)', color: 'var(--slate-12)' }}
              >
                {welcomeText}
                {!welcomeDone && (
                  <span className="inline-block w-0.5 h-3.5 bg-current align-middle ml-0.5 animate-[blink_0.9s_step-end_infinite]" />
                )}
              </div>
            </div>

            {welcomeDone && !termsAccepted && (
              <div
                className="mx-1 mb-4 rounded-2xl border bg-white px-4 py-3 shadow-sm text-sm sm:text-xs leading-relaxed"
                style={{ borderColor: 'var(--slate-4)', color: 'var(--slate-12)' }}
              >
                <p className="font-semibold mb-2 text-slate-900">{t.chat.termsTitle}</p>
                <p className="mb-3 text-slate-600">{t.chat.termsSummary}</p>
                <button
                  type="button"
                  onClick={() => setTermsAccepted(true)}
                  className="mb-2 w-full sm:w-auto px-5 py-2.5 rounded-full text-sm font-semibold text-white transition-opacity hover:opacity-90 cursor-pointer"
                  style={{ background: '#059669' }}
                >
                  {t.chat.termsButton}
                </button>
                <details className="group rounded-lg border border-slate-200/90 bg-slate-50/80 px-3 py-2 text-slate-600">
                  <summary className="cursor-pointer list-none text-xs font-medium text-emerald-700 hover:text-emerald-800 [&::-webkit-details-marker]:hidden">
                    <span className="underline-offset-2 hover:underline">{t.chat.termsExpandLabel}</span>
                  </summary>
                  <p className="mt-2 border-t border-slate-200/90 pt-2 whitespace-pre-line text-xs leading-relaxed text-slate-600">
                    {t.chat.termsBody}
                  </p>
                </details>
              </div>
            )}

            {intakeReady && <FreeTextStep onSubmit={handleFreeTextSubmit} isLoading={isExtracting} />}
          </>
        )}

        {isExtracting && <AiThinkingLoader label="Analizando tu relato…" />}

        {postExtractPhase === 'followup' && extracted && relatoSnapshot && !isExtracting && (
          <>
            {isFollowupLoading ? (
              <AiThinkingLoader label={t.chat.followupAnalyzing} />
            ) : (
              <IntakeFollowupStep
                extracted={extracted}
                userRelato={relatoSnapshot}
                onSubmit={handleFollowupSubmit}
                isLoading={isFollowupLoading}
                inlineError={followupInlineError}
              />
            )}
          </>
        )}

        {postExtractPhase === 'summary' && extracted && !isExtracting && (
          <ExtractedSummary
            extracted={extracted}
            pendingSteps={getPendingSteps(extracted)}
            onContinue={handleSummaryContinue}
          />
        )}

        {postExtractPhase === 'form' &&
          extracted &&
          getPendingSteps(extracted).length > 0 &&
          !isExtracting && (
            <IntakeForm key="intake-form" extracted={extracted} onComplete={handleFormComplete} />
          )}

        {postExtractPhase === 'generating' && <AiThinkingLoader label="Generando tu análisis…" />}

        {postExtractPhase === 'blocked' && policyMessage && (
          <div className="max-w-lg mx-auto flex flex-col gap-2">
            <p className="text-base sm:text-sm text-slate-800 leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--slate-12)' }}>
              {policyMessage}
            </p>
            <DiagnosisWhatsAppCta
              source="chat_policy_block"
              message={WA_MESSAGE_NO_CONDUENTE}
              label="Contactar por WhatsApp"
            />
          </div>
        )}

        {postExtractPhase === 'diagnosis' && diagnosis && (
          <div className="max-w-lg mx-auto flex flex-col">
            {diagnosis === INTAKE_OR_OUTPUT_POLICY_MESSAGE ? (
              <p className="text-base sm:text-sm text-slate-800 leading-relaxed whitespace-pre-wrap mb-1" style={{ color: 'var(--slate-12)' }}>
                {diagnosis}
              </p>
            ) : isDiagnosisMarkdownContent(diagnosis) ? (
              <DiagnosisMarkdownCard markdown={diagnosis} />
            ) : (
              <pre
                className="whitespace-pre-wrap font-sans text-base sm:text-sm text-gray-800 leading-relaxed"
                style={{ color: 'var(--slate-12)' }}
              >
                {diagnosis}
              </pre>
            )}
            <DiagnosisWhatsAppCta
              source="chat_post_diagnosis"
              message={postDiagnosisWhatsAppMessage(diagnosis, caseSnapshot)}
              label={diagnosis === INTAKE_OR_OUTPUT_POLICY_MESSAGE ? 'Contactar por WhatsApp' : 'Hablar con un especialista'}
            />
          </div>
        )}
      </div>
    </div>
  );
}
