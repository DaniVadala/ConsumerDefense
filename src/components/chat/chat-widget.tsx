'use client';

import { useRef, useState, useEffect, useId, useCallback } from 'react';
import { Send, Shield, User, CheckCircle, FileText, Scale, BookOpen, Gavel } from 'lucide-react';
import { useLocale } from '@/lib/i18n/context';
import { useChatAvailability } from '@/lib/chat-availability-context';
import { trackChatMessageSent, trackChatSuggestionClick, trackChatFocus } from '@/lib/analytics';

// ---------------------------------------------------------------------------
// WhatsApp constants
// ---------------------------------------------------------------------------

const WHATSAPP_NUMBER = '5493515284074';

const WA_MESSAGES: Record<string, string> = {
  insulto: 'Hola DefensaYa, tuve dificultades en el chat y quisiera hablar con alguien sobre mi reclamo de consumo.',
  no_conducente: 'Hola DefensaYa, me costó explicar mi problema en el chat. ¿Pueden ayudarme con mi reclamo?',
  fuera_de_scope: 'Hola DefensaYa, tengo una consulta y me dijeron que podían orientarme.',
  emergencia: 'Hola DefensaYa, necesito ayuda urgente con un reclamo de consumo.',
  completed: 'Hola DefensaYa, ya completé el análisis preliminar y quiero hablar con un especialista para presentar mi reclamo.',
  default: 'Hola DefensaYa, necesito ayuda con un reclamo de consumo.',
};

const WA_BUTTON_LABELS: Record<string, string> = {
  insulto: 'Hablar con un especialista',
  no_conducente: 'Hablar con un especialista',
  fuera_de_scope: 'Contactar al equipo',
  emergencia: 'Contactar urgente',
  completed: 'Hablar con especialista para presentar mi reclamo',
  default: 'Continuar por WhatsApp',
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type MessageMeta = {
  isDiagnosis?: boolean;
  showWhatsAppButton?: boolean;
  whatsAppReason?: string;
};

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  meta?: MessageMeta;
};

// ---------------------------------------------------------------------------
// WhatsApp Chat Button
// ---------------------------------------------------------------------------

function WhatsAppChatButton({ reason }: { reason?: string }) {
  const r = reason ?? 'default';
  const waText = WA_MESSAGES[r] ?? WA_MESSAGES.default;
  const label = WA_BUTTON_LABELS[r] ?? WA_BUTTON_LABELS.default;
  const href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(waText)}`;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 mt-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-white shadow-sm transition-all hover:opacity-90 active:scale-95"
      style={{ background: '#25D366' }}
    >
      <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" aria-hidden="true">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
        <path d="M11.894 0C5.354 0 0 5.353 0 11.893c0 2.098.547 4.142 1.588 5.945L.057 24l6.304-1.654a11.913 11.913 0 005.533 1.375h.005C18.43 23.721 23.786 18.369 23.786 11.83 23.786 5.29 18.433-.001 11.894 0zm0 21.785h-.004a9.892 9.892 0 01-5.044-1.381l-.361-.214-3.742.981.998-3.648-.235-.374a9.842 9.842 0 01-1.51-5.27c0-5.445 4.432-9.876 9.882-9.876 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.89-9.865 9.89z" />
      </svg>
      {label}
    </a>
  );
}

// ---------------------------------------------------------------------------
// Diagnosis card with simple markdown rendering
// ---------------------------------------------------------------------------

function renderInline(text: string): React.ReactNode {
  // Also hyperlink bare URLs inside text, wrapping them for overflow safety
  const urlRe = /(https?:\/\/[^\s)]+)/g;
  const withLinks = text.split(urlRe).map((chunk, ci) =>
    urlRe.test(chunk)
      ? <a key={ci} href={chunk} target="_blank" rel="noopener noreferrer" className="text-emerald-700 underline" style={{ wordBreak: 'break-all', overflowWrap: 'anywhere' }}>{chunk}</a>
      : chunk
  );
  // Then handle **bold** within the non-link chunks
  return (
    <>
      {withLinks.map((part, ci) => {
        if (typeof part !== 'string') return part;
        const bolds = part.split(/(\*\*[^*]+\*\*)/);
        return bolds.map((seg, si) =>
          seg.startsWith('**') && seg.endsWith('**')
            ? <strong key={`${ci}-${si}`} className="font-semibold">{seg.slice(2, -2)}</strong>
            : seg
        );
      })}
    </>
  );
}

const SECTION_ICONS: Record<string, React.ReactNode> = {
  'RESUMEN': <FileText className="w-3.5 h-3.5" />,
  'PLAZOS': <Scale className="w-3.5 h-3.5" />,
  'PRESCRIPCI': <Scale className="w-3.5 h-3.5" />,
  'PRUEBA': <BookOpen className="w-3.5 h-3.5" />,
  'PROCEDIMIENTO': <Gavel className="w-3.5 h-3.5" />,
  'DEFAULT': <CheckCircle className="w-3.5 h-3.5" />,
};

function getSectionIcon(title: string): React.ReactNode {
  const upper = title.toUpperCase();
  for (const [key, icon] of Object.entries(SECTION_ICONS)) {
    if (key !== 'DEFAULT' && upper.includes(key)) return icon;
  }
  return SECTION_ICONS.DEFAULT;
}

function DiagnosisCard({ content }: { content: string }) {
  const clean = (() => {
    const firstSection = content.search(/(\n|^)(\d+\.|##\s)/);
    return firstSection > 0 ? content.slice(firstSection).trimStart() : content;
  })();

  const lines = clean.split('\n');

  return (
    <div
      className="rounded-2xl rounded-bl-sm border shadow-md w-full overflow-hidden"
      style={{ borderColor: '#bbf7d0', maxWidth: 'min(90%, 380px)' }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-2.5 px-4 py-3"
        style={{ background: 'linear-gradient(135deg, #059669, #0d9488)' }}
      >
        <div className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
          <CheckCircle className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-white font-bold text-xs uppercase tracking-widest">Análisis preliminar</p>
          <p className="text-white/70 text-[10px]">Generado por IA · DefensaYa</p>
        </div>
      </div>

      {/* Disclaimer */}
      <div
        className="flex items-start gap-2 px-4 py-2.5 text-xs"
        style={{ background: '#fefce8', borderBottom: '1px solid #fde68a' }}
      >
        <span className="flex-shrink-0 mt-px">⚠️</span>
        <span style={{ color: '#92400e' }}>
          <strong>Orientativo y preliminar.</strong> Debe ser revisado por un abogado matriculado antes de tomar decisiones legales.
        </span>
      </div>

      {/* Content */}
      <div className="px-4 py-3 space-y-1" style={{ background: 'linear-gradient(160deg,#f0fdf4,#f0fdfa)' }}>
        {lines.map((line, i) => {
          // Numbered section header: "1. RESUMEN DE HECHOS:" or "## RESUMEN"
          const numHeader = line.match(/^(\d+)\. (.+)/);
          const mdHeader = line.match(/^## (.+)/);
          if (numHeader || mdHeader) {
            const title = numHeader ? numHeader[2] : mdHeader![1];
            const num = numHeader ? numHeader[1] : null;
            return (
              <div key={i} className="flex items-center gap-2 mt-3 mb-1 first:mt-0">
                {num && (
                  <span className="flex-shrink-0 w-5 h-5 rounded-full text-white text-[10px] font-bold flex items-center justify-center" style={{ background: '#059669' }}>{num}</span>
                )}
                <span className="text-emerald-800 font-bold text-xs uppercase tracking-wide flex items-center gap-1">
                  {getSectionIcon(title)} {title.replace(/:$/, '')}
                </span>
              </div>
            );
          }
          if (line.startsWith('### ')) {
            return <p key={i} className="font-semibold text-xs text-slate-600 mt-2 uppercase tracking-wide">{line.slice(4)}</p>;
          }
          if (line.startsWith('- ') || line.startsWith('* ')) {
            return (
              <div key={i} className="flex items-start gap-1.5 pl-1">
                <span className="flex-shrink-0 mt-[3px] w-1.5 h-1.5 rounded-full" style={{ background: '#10b981' }} />
                <p className="text-xs text-slate-700 leading-relaxed" style={{ overflowWrap: 'anywhere' }}>
                  {renderInline(line.slice(2))}
                </p>
              </div>
            );
          }
          if (line.trim() === '') return <div key={i} className="h-1" />;
          return (
            <p key={i} className="text-xs text-slate-700 leading-relaxed" style={{ overflowWrap: 'anywhere' }}>
              {renderInline(line)}
            </p>
          );
        })}
      </div>
    </div>
  );
}

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
      if (i >= text.length) { clearInterval(id); setDone(true); }
    }, speed);
    return () => clearInterval(id);
  }, [text, speed]);
  return { displayed, done };
}

// ---------------------------------------------------------------------------
// Main widget
// ---------------------------------------------------------------------------

export function ChatWidget() {
  const { t, lang } = useLocale();
  const { markConversationEnded, isConversationEnded, markRateLimited } = useChatAvailability();
  const instanceId = useId();
  const inputId = `chat-input-${instanceId}`;

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [inputFocused, setInputFocused] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [bypassToken, setBypassToken] = useState<string | undefined>(undefined);
  const sessionIdRef = useRef<string | undefined>(undefined);

  const scrollViewportRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = scrollViewportRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, isLoading]);

  // Auto-focus input on mount (triggered after reset remounts the widget)
  useEffect(() => {
    const t = setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus({ preventScroll: true });
      }
    }, 120);
    return () => clearTimeout(t);
  }, []);

  // Read RATE_LIMIT_BYPASS_TOKEN from ?bypass=TOKEN in the URL.
  // Stored in sessionStorage so it persists across page navigations within the session.
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const token = params.get('bypass');
      if (token) {
        sessionStorage.setItem('rl_bypass', token);
        setBypassToken(token);
      } else {
        const stored = sessionStorage.getItem('rl_bypass');
        if (stored) setBypassToken(stored);
      }
    } catch {
      // sessionStorage unavailable (private browsing edge cases) — ignore
    }
  }, []);

  const { displayed: welcomeText, done: welcomeDone } = useTypewriter(t.chat.welcome, 8);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading || isConversationEnded) return;

      setIsLoading(true);
      setErrorNotice(null);
      setShowSuggestions(false);

      const userMsg: Message = { id: `${Date.now()}-user`, role: 'user', content: content.trim() };
      setMessages((prev) => [...prev, userMsg]);
      setInput('');
      if (textareaRef.current) textareaRef.current.style.height = 'auto';

      trackChatMessageSent(messages.filter((m) => m.role === 'user').length + 1);

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: content.trim(),
            sessionId: sessionIdRef.current,
            ...(bypassToken ? { bypassToken } : {}),
          }),
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        // Persist session id from response header
        const newSessionId = res.headers.get('X-Session-Id');
        if (newSessionId) sessionIdRef.current = newSessionId;

        const currentStep = res.headers.get('X-Current-Step') ?? '';
        const showWA = res.headers.get('X-Show-Whatsapp-Button') === 'true';
        const waReason = res.headers.get('X-Whatsapp-Reason') ?? undefined;
        const isDiagnosis = currentStep === 'completed';
        const contentType = res.headers.get('content-type') ?? '';

        if (isDiagnosis || showWA) markConversationEnded();

        if (contentType.includes('application/json')) {
          // Early-exit / escalation — plain JSON response
          const data = await res.json() as { text?: string; sessionId?: string; showWhatsAppButton?: boolean; whatsAppReason?: string; rateLimited?: boolean };
          if (data.sessionId) sessionIdRef.current = data.sessionId;
          if (data.rateLimited) {
            markRateLimited();
          } else if (data.showWhatsAppButton) {
            markConversationEnded();
          }
          const text = data.text?.trim() || (lang === 'en' ? "Sorry, I couldn't process that." : 'No pude procesar tu mensaje, intentá de nuevo.');
          setMessages((prev) => [...prev, {
            id: `${Date.now()}-bot`,
            role: 'assistant',
            content: text,
            meta: {
              showWhatsAppButton: data.showWhatsAppButton,
              whatsAppReason: data.whatsAppReason,
            },
          }]);
        } else {
          // Streaming text response — read the full stream
          if (!res.body) throw new Error('No response body');
          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let accumulated = '';
          const botMsgId = `${Date.now()}-bot`;
          setMessages((prev) => [...prev, { id: botMsgId, role: 'assistant', content: '', meta: { isDiagnosis, showWhatsAppButton: showWA, whatsAppReason: waReason } }]);
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            accumulated += decoder.decode(value, { stream: true });
            setMessages((prev) =>
              prev.map((m) => (m.id === botMsgId ? { ...m, content: accumulated } : m))
            );
          }
          setIsLoading(false);
          return;
        }
      } catch {
        setMessages((prev) => prev.filter((m) => m.id !== userMsg.id));
        setInput(content.trim());
        setErrorNotice(
          lang === 'en'
            ? 'Connection error — your message was restored. Please try again.'
            : 'Error de conexión — tu mensaje fue restaurado. Por favor, intentá de nuevo.',
        );
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, isConversationEnded, markConversationEnded, messages, lang, bypassToken],
  );

  const handleSubmit = (e?: React.FormEvent) => { e?.preventDefault(); sendMessage(input); };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
  };

  const isLive = inputFocused;

  return (
    <div
      id="chat-widget"
      className={`flex flex-col h-full rounded-2xl overflow-hidden transition-shadow duration-300 ${
        inputFocused ? 'shadow-[0_0_0_3px_rgba(16,185,129,0.45),0_20px_40px_-12px_rgb(0_0_0/0.18)]' : ''
      }`}
      style={{
        background: 'white',
        border: '1px solid var(--slate-4)',
        boxShadow: inputFocused ? undefined : '0 20px 40px -12px rgb(0 0 0 / 0.12)',
      }}
    >
      {/* Header */}
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
            style={{ background: '#4ade80', animation: 'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite' }}
          />
          <span className="text-xs text-white/90 font-medium">
            {isLive ? t.chat.live : t.chat.online}
          </span>
        </div>
      </div>

      {/* Messages area */}
      <div
        ref={scrollViewportRef}
        className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-5"
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
                onClick={() => { trackChatSuggestionClick(suggestion); sendMessage(suggestion); }}
                className="text-xs font-medium px-3 py-1.5 rounded-full border border-emerald-300 text-emerald-700 bg-white hover:bg-emerald-50 transition-colors cursor-pointer"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}

        {/* Conversation */}
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
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-slate-200">
                  <User className="w-4 h-4 text-slate-500" />
                </div>
              </div>
            );
          }
          return (
            <div key={message.id} className="flex items-start gap-2 mb-4">
              <BotAvatar />
              <div className="flex flex-col items-start max-w-[85%]">
                {message.meta?.isDiagnosis ? (
                  <DiagnosisCard content={message.content} />
                ) : (
                  <div
                    className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 text-sm leading-relaxed shadow-sm whitespace-pre-wrap"
                    style={{ border: '1px solid var(--slate-4)', color: 'var(--slate-12)' }}
                  >
                    {message.content}
                  </div>
                )}
                {message.meta?.showWhatsAppButton && (
                  <WhatsAppChatButton reason={message.meta.whatsAppReason} />
                )}
              </div>
            </div>
          );
        })}

        {isLoading && <TypingIndicator label={t.chat.typing} />}
      </div>

      {/* Error notice */}
      {errorNotice && (
        <div className="px-4 py-2 text-xs text-amber-700 bg-amber-50 border-t border-amber-100">
          {errorNotice}
        </div>
      )}

      {/* Input area */}
      <div
        className="flex-shrink-0 px-4 py-3 border-t"
        style={{ borderColor: 'var(--slate-4)', background: 'white' }}
      >
        <form onSubmit={handleSubmit} className="flex items-end gap-2">
          <label htmlFor={inputId} className="sr-only">{t.chat.placeholder}</label>
          <textarea
            id={inputId}
            ref={textareaRef}
            data-chat-input
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => { setInputFocused(true); trackChatFocus(); }}
            onBlur={() => setInputFocused(false)}
            placeholder={t.chat.placeholder}
            rows={1}
            disabled={isLoading || isConversationEnded}
            className="flex-1 resize-none rounded-xl px-4 py-3 text-sm outline-none transition-all duration-200 overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              border: inputFocused ? '1.5px solid var(--accent-9)' : '1px solid var(--slate-5)',
              boxShadow: inputFocused ? '0 0 0 3px rgba(16,185,129,0.18)' : 'none',
              background: 'var(--slate-1)',
              color: 'var(--slate-12)',
              minHeight: '44px',
              maxHeight: '120px',
            }}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-opacity disabled:opacity-40"
            style={{ background: 'var(--accent-9)' }}
            aria-label="Enviar"
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </form>
        <p className="text-center text-xs mt-2" style={{ color: 'var(--slate-9)' }}>
          {t.chat.hintText}
        </p>
      </div>
    </div>
  );
}
