'use client';

import { useRef, useState, useEffect, useId, useCallback } from 'react';
import { Send, Shield, User, MessageCircle } from 'lucide-react';
import { useLocale } from '@/lib/i18n/context';
import { useChatAvailability } from '@/lib/chat-availability-context';
import { trackChatMessageSent, trackChatSuggestionClick, trackChatFocus, trackWhatsAppClick } from '@/lib/analytics';
import { DiagnosticCard } from './diagnostic-card';
import { detectAbuse, detectInjection } from '@/lib/ai/input-guard';
import type { ChatAction, DiagnosisData, ChatApiResponse, FieldsExtracted } from '@/lib/chatbot/types';

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '5493515284074';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

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

function TypingIndicator({ label }: { label: string }) {
  return (
    <div className="flex items-end gap-2 mb-4" role="status" aria-live="polite">
      <BotAvatar />
      <div
        className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 text-sm shadow-sm"
        style={{ border: '1px solid var(--slate-4)', color: 'var(--slate-11)' }}
      >
        <span className="flex items-center gap-2">
          <span className="text-xs" style={{ color: 'var(--slate-9)' }}>{label}</span>
          <span className="flex gap-0.5" aria-hidden="true">
            <span className="animate-bounce w-1.5 h-1.5 rounded-full inline-block" style={{ background: 'var(--accent-9)', animationDelay: '0ms' }} />
            <span className="animate-bounce w-1.5 h-1.5 rounded-full inline-block" style={{ background: 'var(--accent-9)', animationDelay: '150ms' }} />
            <span className="animate-bounce w-1.5 h-1.5 rounded-full inline-block" style={{ background: 'var(--accent-9)', animationDelay: '300ms' }} />
          </span>
        </span>
      </div>
    </div>
  );
}

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

function WhatsAppButton({
  label,
  waMessage,
  trackId,
}: {
  label: string;
  waMessage: string;
  trackId: string;
}) {
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(waMessage)}`;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackWhatsAppClick(trackId)}
      className="flex items-center justify-center gap-2 w-full py-3 px-5 text-white font-semibold text-[0.9375rem] rounded-xl no-underline transition-opacity hover:opacity-90 mt-3"
      style={{ background: '#25D366' }}
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>
      {label}
    </a>
  );
}

// ---------------------------------------------------------------------------
// Main widget
// ---------------------------------------------------------------------------

export function ChatWidget() {
  const { t, lang } = useLocale();
  const instanceId = useId();
  const inputId = `chat-input-${instanceId}`;

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [retryNotice, setRetryNotice] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [inputFocused, setInputFocused] = useState(false);

  // LLM-identified fields — persisted across turns and sent back each request
  // so the field-status checklist stays accurate for any company name / date format
  const [fieldsExtracted, setFieldsExtracted] = useState<FieldsExtracted | null>(null);

  // Terminal state — set when conversation must end
  const [endState, setEndState] = useState<{
    type: ChatAction;
    diagnosis: DiagnosisData | null;
    context: string;
  } | null>(null);

  const { setConversationEnded } = useChatAvailability();
  const scrollViewportRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isEnded = endState !== null;

  // Auto-scroll on new content
  useEffect(() => {
    const el = scrollViewportRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, isLoading, endState]);

  // Sync ended state to context (for hero CTA button)
  useEffect(() => {
    if (isEnded) setConversationEnded(true);
  }, [isEnded, setConversationEnded]);

  const { displayed: welcomeText, done: welcomeDone } = useTypewriter(t.chat.welcome, 8);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading || isEnded) return;

      setIsLoading(true);
      setRetryNotice(null);
      setShowSuggestions(false);

      const userMsg: Message = {
        id: `${Date.now()}-user`,
        role: 'user',
        content: content.trim(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setInput('');
      if (textareaRef.current) textareaRef.current.style.height = 'auto';

      trackChatMessageSent(messages.filter((m) => m.role === 'user').length + 1);

      // ----- Client-side guards (fast path, no API call) -----
      const injection = detectInjection(content);
      const abuse = detectAbuse(content);

      if (injection.detected) {
        const guardMsg: Message = {
          id: `${Date.now()}-bot`,
          role: 'assistant',
          content:
            lang === 'en'
              ? 'I can only help you with consumer rights issues. If you have a specific complaint, tell me about it. Would you like to speak with a lawyer?'
              : 'Solo puedo ayudarte con consultas de defensa del consumidor. Si tenés un problema concreto, contame de qué se trata. ¿Querés hablar con un abogado?',
        };
        setMessages((prev) => [...prev, guardMsg]);
        setEndState({
          type: 'whatsapp',
          diagnosis: null,
          context: content.trim().slice(0, 100),
        });
        setIsLoading(false);
        return;
      }

      if (abuse) {
        const guardMsg: Message = {
          id: `${Date.now()}-bot`,
          role: 'assistant',
          content:
            lang === 'en'
              ? 'Please let\'s talk respectfully so I can help you. If you\'d like to continue, tell me your issue — or I can connect you with a lawyer.'
              : 'Te pido que hablemos con respeto para poder ayudarte mejor. Si querés continuar, contame tu problema — o te puedo conectar con un abogado.',
        };
        setMessages((prev) => [...prev, guardMsg]);
        setEndState({
          type: 'respect',
          diagnosis: null,
          context: content.trim().slice(0, 100),
        });
        setIsLoading(false);
        return;
      }

      // ----- API call -----
      try {
        const conversationHistory = [...messages, userMsg].map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: conversationHistory, locale: lang, fieldsExtracted }),
        });

        const data: ChatApiResponse = await res.json();

        // Transient error (rate-limit, server blip) — roll back the user message
        // and restore it to the input so the user can resend.
        // CRITICAL: do NOT inject anything into messages here; it would pollute
        // the conversation history sent to the LLM on the next turn.
        if (data.retryable) {
          setMessages((prev) => prev.filter((m) => m.id !== userMsg.id));
          setInput(content.trim());
          setRetryNotice(
            lang === 'en'
              ? 'Could not reach the service — your message was restored. Please try again.'
              : 'No se pudo conectar — tu mensaje fue restaurado. Por favor, intentá de nuevo.',
          );
          return;
        }

        const validActions: ChatAction[] = ['message', 'diagnosis', 'whatsapp', 'respect'];
        const action: ChatAction = validActions.includes(data?.action as ChatAction)
          ? (data.action as ChatAction)
          : 'whatsapp';
        const text = data?.text?.trim() || (lang === 'en'
          ? "I'm having a technical issue. Let me connect you with a lawyer."
          : 'Tuve un problema técnico. Te conecto con un abogado.');
        const diagnosis = data?.diagnosis ?? null;

        // Accumulate LLM-identified fields for next turn
        if (data.fields_extracted) {
          setFieldsExtracted((prev) => ({
            empresa:        data.fields_extracted!.empresa        ?? prev?.empresa        ?? null,
            fecha_hechos:   data.fields_extracted!.fecha_hechos   ?? prev?.fecha_hechos   ?? null,
            monto:          data.fields_extracted!.monto          ?? prev?.monto          ?? null,
            reclamo_previo: data.fields_extracted!.reclamo_previo || (prev?.reclamo_previo ?? false),
            documentacion:  data.fields_extracted!.documentacion  || (prev?.documentacion  ?? false),
          }));
        }

        const botMsg: Message = {
          id: `${Date.now()}-bot`,
          role: 'assistant',
          content: text,
        };
        setMessages((prev) => [...prev, botMsg]);

        // Terminal actions end the conversation
        if (action === 'diagnosis' || action === 'whatsapp' || action === 'respect') {
          const lastUserContent = content.trim().slice(0, 200);
          setEndState({
            type: action,
            diagnosis: action === 'diagnosis' ? (diagnosis ?? null) : null,
            context: lastUserContent,
          });
        }
      } catch (err) {
        console.error('Chat error:', err instanceof Error ? err.message : String(err));
        // True network failure — same rollback, no history pollution.
        setMessages((prev) => prev.filter((m) => m.id !== userMsg.id));
        setInput(content.trim());
        setRetryNotice(
          lang === 'en'
            ? 'Connection error — your message was restored. Please try again.'
            : 'Error de conexión — tu mensaje fue restaurado. Por favor, intentá de nuevo.',
        );
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, isEnded, messages, lang]
  );

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    sendMessage(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // WA message for non-diagnosis endings
  const waContextMessage =
    lang === 'en'
      ? `Hi! I need guidance on a consumer rights issue. ${endState?.context ?? ''}`
      : `Hola! Necesito orientación sobre un problema de consumo. ${endState?.context ?? ''}`;

  const waButtonLabel =
    lang === 'en' ? 'Talk to a lawyer on WhatsApp' : 'Hablar con un abogado por WhatsApp';

  const endedPlaceholder =
    lang === 'en'
      ? 'Conversation ended · Start a new one with the button above'
      : 'Conversación finalizada · Iniciá una nueva con el botón de arriba';

  const isLive = inputFocused && !isEnded;

  return (
    <div
      id="chat-widget"
      className={`flex flex-col h-full rounded-2xl overflow-hidden transition-shadow duration-300 ${
        inputFocused && !isEnded
          ? 'shadow-[0_0_0_3px_rgba(16,185,129,0.45),0_20px_40px_-12px_rgb(0_0_0/0.18)]'
          : ''
      }`}
      style={{
        background: 'white',
        border: '1px solid var(--slate-4)',
        boxShadow:
          inputFocused && !isEnded
            ? undefined
            : '0 20px 40px -12px rgb(0 0 0 / 0.12)',
      }}
    >
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div
        className="flex items-center gap-3 px-5 py-4 flex-shrink-0 text-white"
        style={{ background: 'linear-gradient(135deg, var(--accent-9), var(--teal-9))' }}
      >
        <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center ring-2 ring-white/30">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="font-bold text-sm leading-tight">DefensaYa</p>
          <p className="text-white/80 text-xs">{t.chat.subtitle}</p>
        </div>
        <div
          className="ml-auto flex items-center gap-2 rounded-full px-3 py-1"
          style={{ background: 'rgba(255,255,255,0.15)' }}
        >
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{
              background: isEnded ? '#94a3b8' : '#4ade80',
              animation: isEnded ? 'none' : 'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite',
            }}
          />
          <span className="text-xs text-white/90 font-medium">
            {isEnded ? (lang === 'en' ? 'Ended' : 'Finalizado') : isLive ? t.chat.live : t.chat.online}
          </span>
        </div>
      </div>

      {/* ── Messages area ─────────────────────────────────────────────────── */}
      <div
        ref={scrollViewportRef}
        className="flex-1 overflow-y-auto px-4 py-5"
        style={{ minHeight: 0, background: 'var(--slate-2)' }}
        aria-live="polite"
      >
        {/* Welcome message */}
        <div className="flex items-end gap-2 mb-4">
          <BotAvatar />
          <div
            className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 text-sm max-w-[85%] leading-relaxed shadow-sm"
            style={{ border: '1px solid var(--slate-4)', color: 'var(--slate-12)' }}
          >
            {welcomeText}
            {!welcomeDone && (
              <span className="inline-block w-0.5 h-3.5 bg-current align-middle ml-0.5 animate-[blink_0.9s_step-end_infinite]" />
            )}
          </div>
        </div>

        {/* Suggestion chips */}
        {showSuggestions && messages.length === 0 && (
          <div className="flex flex-wrap gap-2 mb-5 pl-10">
            {t.chat.suggestions.map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => {
                  trackChatSuggestionClick(suggestion);
                  sendMessage(suggestion);
                }}
                className="text-xs font-medium px-3 py-1.5 rounded-full border border-emerald-300 text-emerald-700 bg-white hover:bg-emerald-50 transition-colors cursor-pointer"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}

        {/* Conversation messages */}
        {messages.map((message) => {
          if (message.role === 'user') {
            return (
              <div key={message.id} className="flex items-end justify-end gap-2 mb-4">
                <div
                  className="text-white rounded-2xl rounded-br-sm px-4 py-3 text-sm max-w-[85%] leading-relaxed shadow-sm"
                  style={{ background: 'var(--accent-9)' }}
                >
                  {message.content}
                </div>
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                  <User size={14} className="text-gray-500" />
                </div>
              </div>
            );
          }
          return (
            <div key={message.id} className="flex items-end gap-2 mb-4">
              <div className="flex-shrink-0 self-start mt-1">
                <BotAvatar />
              </div>
              <div
                className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 text-sm max-w-[85%] leading-relaxed whitespace-pre-wrap shadow-sm"
                style={{ border: '1px solid var(--slate-4)', color: 'var(--slate-12)' }}
              >
                {message.content}
              </div>
            </div>
          );
        })}

        {/* Typing indicator */}
        {isLoading && <TypingIndicator label={t.chat.typing} />}

        {/* Transient retry notice — NOT part of conversation history */}
        {retryNotice && !isLoading && (
          <div className="flex items-center gap-2 px-3 py-2 mb-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
            <span>⚠ {retryNotice}</span>
          </div>
        )}

        {/* Terminal states */}
        {endState && (
          <div className="mt-2 mb-4">
            {/* Diagnosis card */}
            {endState.type === 'diagnosis' && endState.diagnosis && (
              <DiagnosticCard data={endState.diagnosis} lang={lang} />
            )}

            {/* WhatsApp / Respect ending */}
            {(endState.type === 'whatsapp' || endState.type === 'respect') && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm mx-0">
                <div className="flex items-center gap-2 mb-2">
                  <MessageCircle className="w-4 h-4 text-emerald-700" />
                  <p className="text-sm font-semibold text-emerald-900">
                    {lang === 'en'
                      ? 'Talk to a specialized lawyer'
                      : 'Hablá con un abogado especializado'}
                  </p>
                </div>
                <p className="text-xs text-emerald-800 mb-1">
                  {lang === 'en'
                    ? 'Get personalized advice for your specific situation.'
                    : 'Obtené asesoramiento personalizado para tu situación concreta.'}
                </p>
                <WhatsAppButton
                  label={waButtonLabel}
                  waMessage={waContextMessage}
                  trackId="chat_end"
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Input area ───────────────────────────────────────────────────── */}
      <div
        className="flex-shrink-0 px-4 py-3 bg-white"
        style={{ borderTop: '1px solid var(--slate-4)' }}
      >
        {isEnded ? (
          <p className="text-center text-xs py-2" style={{ color: 'var(--slate-9)' }}>
            {endedPlaceholder}
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex items-end gap-2">
            <textarea
              id={inputId}
              ref={textareaRef}
              data-chat-input
              rows={1}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
              }}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                setInputFocused(true);
                trackChatFocus();
              }}
              onBlur={() => setInputFocused(false)}
              placeholder={t.chat.placeholder}
              disabled={isLoading}
              className="flex-1 resize-none rounded-2xl px-4 py-2.5 text-sm outline-none transition-all disabled:opacity-50"
              style={{
                border: '1.5px solid var(--slate-6)',
                color: 'var(--slate-12)',
                background: 'var(--slate-1)',
                minHeight: '42px',
                maxHeight: '120px',
                lineHeight: '1.5',
              }}
              aria-label={t.chat.placeholder}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center disabled:opacity-40 transition-opacity hover:opacity-80 cursor-pointer"
              style={{ background: 'var(--accent-9)' }}
              aria-label={lang === 'en' ? 'Send' : 'Enviar'}
            >
              <Send className="w-4 h-4 text-white" />
            </button>
          </form>
        )}
        {!isEnded && (
          <p className="text-center text-[10px] mt-1.5" style={{ color: 'var(--slate-9)' }}>
            {t.chat.hintText}
          </p>
        )}
      </div>
    </div>
  );
}

