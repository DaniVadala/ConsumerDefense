'use client';

import { useRef, useState, useEffect, useId } from 'react';
import { Send, Shield, User, CalendarDays, Mail } from 'lucide-react';
import { useCalModal } from '@/components/cal-modal';
import { openMailCompose } from '@/lib/utils';
import { DiagnosticCard } from './diagnostic-card';
import { WhatsAppCTA } from './whatsapp-cta';
import { AreaSelector } from './area-selector';
import { IntakeQuestion } from './intake-question';
import { FallbackWhatsApp } from './fallback-whatsapp';
import { UrgenciaWidget } from './urgencia-widget';
import { useLocale } from '@/lib/i18n/context';
import { useChatAvailability } from '@/lib/chat-availability-context';
import {
  trackChatMessageSent,
  trackChatSuggestionClick,
  trackChatDiagnosticGenerated,
  trackChatFocus,
  trackChatAreaSelected,
  trackChatIntakeAnswer,
  trackLeadFormOpen,
} from '@/lib/analytics';
import type { UIComponent } from '@/lib/chatbot/state';
import { LeadForm } from '@/components/lead-form';

interface ChatMsg {
  role: 'user' | 'bot';
  text?: string | null;
  uiComponents?: UIComponent[];
}

function BotAvatar() {
  return (
    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'var(--accent-9)' }}>
      <Shield className="w-4 h-4 text-white" />
    </div>
  );
}

function TypingIndicator({ label }: { label: string }) {
  return (
    <div className="flex items-end gap-2 mb-4" role="status" aria-live="polite">
      <BotAvatar />
      <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 text-sm shadow-sm" style={{ border: '1px solid var(--slate-4)', color: 'var(--slate-11)' }}>
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

export function ChatWidget() {
  const { t, lang } = useLocale();
  const instanceId = useId();
  const inputId = `chat-input-${instanceId}`;

  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [inputFocused, setInputFocused] = useState(false);
  const [formOpen, setFormOpen] = useState(false);

  const { openCalModal } = useCalModal();
  const { setConversationEnded } = useChatAvailability();
  const scrollViewportRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = scrollViewportRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, isLoading]);

  const { displayed: welcomeText, done: welcomeDone } = useTypewriter(t.chat.welcome, 8);

  const handleSend = async (text?: string) => {
    const message = (text ?? input).trim();
    if (!message || isLoading) return;

    setInput('');
    setShowSuggestions(false);
    setError(null);

    const msgNum = messages.filter((m) => m.role === 'user').length + 1;
    trackChatMessageSent(msgNum);

    setMessages((prev) => [...prev, { role: 'user', text: message }]);
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, sessionId, locale: lang }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      setSessionId(data.sessionId);

      const botMsg: ChatMsg = {
        role: 'bot',
        text: data.textResponse,
        uiComponents: data.uiComponents || [],
      };
      setMessages((prev) => [...prev, botMsg]);

      // Track diagnostic generation
      const diagComponent = (data.uiComponents || []).find(
        (c: UIComponent) => c.type === 'diagnostico'
      );
      if (diagComponent?.type === 'diagnostico') {
        trackChatDiagnosticGenerated(diagComponent.data.casoId, diagComponent.data.area);
      }
    } catch (err) {
      console.error('Chat error:', err);
      setError('Ocurrió un error. Por favor intentá de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const lastBotMsgIdx = messages.reduce(
    (last, msg, idx) => (msg.role === 'bot' ? idx : last),
    -1
  );

  const renderUIComponent = (component: UIComponent, idx: number, msgIdx: number) => {
    const isActive = msgIdx === lastBotMsgIdx && !isLoading;

    switch (component.type) {
      case 'areaSelector':
        return isActive ? (
          <AreaSelector
            key={idx}
            areas={component.areas}
            onSelect={(area) => {
              trackChatAreaSelected(area.key);
              handleSend(area.label);
            }}
          />
        ) : (
          <AreaSelector key={idx} areas={component.areas} onSelect={() => {}} />
        );

      case 'intakeQuestion':
        return (
          <IntakeQuestion
            key={idx}
            pregunta={component.pregunta}
            placeholder={(component as { placeholder?: string }).placeholder}
            opciones={component.opciones}
            tipoInput={component.tipoInput}
            pasoActual={component.pasoActual}
            pasoTotal={component.pasoTotal}
            onSelect={(text) => {
              trackChatIntakeAnswer(component.pasoActual, component.pasoTotal);
              handleSend(text);
            }}
            isActive={isActive}
          />
        );

      case 'diagnostico':
        return <DiagnosticCard key={idx} data={component.data} />;

      case 'whatsappCTA':
        return (
          <WhatsAppCTA
            key={idx}
            casoId={component.casoId}
            area={component.area}
            proveedor={component.proveedor}
            resumen={component.resumen}
          />
        );

      case 'fallbackWhatsApp':
        return <FallbackWhatsApp key={idx} contexto={component.contexto} />;

      case 'urgencia':
        return (
          <UrgenciaWidget
            key={idx}
            motivo={component.motivo}
            recurso={component.recurso}
            contacto={component.contacto}
          />
        );
    }
  };

  const lastBotMsg = messages.filter(m => m.role === 'bot').slice(-1)[0];
  const isConversationEnded = lastBotMsg?.uiComponents?.some(
    c => c.type === 'diagnostico' || c.type === 'whatsappCTA' || c.type === 'fallbackWhatsApp' || c.type === 'urgencia'
  );

  useEffect(() => {
    if (isConversationEnded) setConversationEnded(true);
  }, [isConversationEnded, setConversationEnded]);

  return (
    <div
      id="chat-widget"
      className={`flex flex-col h-full rounded-2xl overflow-hidden transition-shadow duration-300 ${
        inputFocused ? 'shadow-[0_0_0_3px_rgba(16,185,129,0.45),0_20px_40px_-12px_rgb(0_0_0/0.18)]' : ''
      }`}
      style={{ background: 'white', border: '1px solid var(--slate-4)', boxShadow: inputFocused ? undefined : '0 20px 40px -12px rgb(0 0 0 / 0.12)' }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 flex-shrink-0 text-white" style={{ background: 'linear-gradient(135deg, var(--accent-9), var(--teal-9))' }}>
        <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center ring-2 ring-white/30">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="font-bold text-sm leading-tight">DefensaYa</p>
          <p className="text-white/80 text-xs">{t.chat.subtitle}</p>
        </div>
        <div className="ml-auto flex items-center gap-2 rounded-full px-3 py-1" style={{ background: 'rgba(255,255,255,0.15)' }}>
          <div className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ background: inputFocused ? '#ef4444' : 'var(--green-4)' }} />
          <span className="text-xs text-white/90 font-medium">{inputFocused ? 'En vivo' : 'En línea'}</span>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollViewportRef} className="flex-1 overflow-y-auto px-4 py-5" style={{ minHeight: 0, background: 'var(--slate-2)' }} aria-live="polite">
        {/* Welcome */}
        <div className="flex items-end gap-2 mb-4">
          <BotAvatar />
          <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 text-sm max-w-[85%] leading-relaxed shadow-sm" style={{ border: '1px solid var(--slate-4)', color: 'var(--slate-12)' }}>
            {welcomeText}
            {!welcomeDone && <span className="inline-block w-0.5 h-3.5 bg-current align-middle ml-0.5 animate-[blink_0.9s_step-end_infinite]" />}
          </div>
        </div>

        {/* Suggestions */}
        {showSuggestions && messages.length === 0 && (
          <div className="flex flex-wrap gap-2 mb-5 pl-10">
            {t.chat.suggestions.map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => { trackChatSuggestionClick(suggestion); handleSend(suggestion); }}
                className="text-xs font-medium px-3 py-1.5 rounded-full border border-emerald-300 text-emerald-700 bg-white hover:bg-emerald-50 transition-colors cursor-pointer"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}

        {/* Messages */}
        {messages.map((message, msgIdx) => {
          if (message.role === 'user') {
            return (
              <div key={msgIdx} className="flex items-end justify-end gap-2 mb-4">
                <div className="text-white rounded-2xl rounded-br-sm px-4 py-3 text-sm max-w-[85%] leading-relaxed shadow-sm" style={{ background: 'var(--accent-9)' }}>
                  {message.text}
                </div>
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                  <User size={14} className="text-gray-500" />
                </div>
              </div>
            );
          }

          return (
            <div key={msgIdx} className="flex items-end gap-2 mb-4">
              <div className="flex-shrink-0 self-start mt-1"><BotAvatar /></div>
              <div className="max-w-[85%] space-y-2">
                {message.text && message.text.trim() && (
                  <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap shadow-sm" style={{ border: '1px solid var(--slate-4)', color: 'var(--slate-12)' }}>
                    {message.text}
                  </div>
                )}
                {(message.uiComponents || []).map((component, idx) => {
                  const hasDiagnosticoInMessage = message.uiComponents?.some(c => c.type === 'diagnostico');
                  if (component.type === 'whatsappCTA' && hasDiagnosticoInMessage) return null;
                  return renderUIComponent(component, idx, msgIdx);
                })}
              </div>
            </div>
          );
        })}

        {/* Error inline */}
        {error && !isLoading && (
          <div className="flex items-end gap-2 mb-4">
            <BotAvatar />
            <div className="bg-red-50 border border-red-200 rounded-2xl rounded-bl-sm px-4 py-3 text-sm text-red-700 shadow-sm">
              {error}
            </div>
          </div>
        )}

        {isLoading && <TypingIndicator label={t.chat.typing} />}
      </div>

      {/* Hint bar */}
      {showSuggestions && messages.length === 0 && (
        <div className="flex-shrink-0 flex justify-center py-2 bg-slate-50 border-t border-slate-100">
          <button onClick={() => textareaRef.current?.focus()} className="text-xs text-slate-400 flex items-center gap-1.5 hover:text-slate-600 transition-colors">
            <span className="animate-bounce inline-block">👇</span>
            {t.chat.hintText}
          </button>
        </div>
      )}

      {/* Input */}
      <div className="flex-shrink-0 px-4 py-3 bg-white" style={{ borderTop: '1px solid var(--slate-4)' }}>
        <div className="flex items-end gap-2">
          <textarea
            id={inputId}
            ref={textareaRef}
            value={input}
            aria-label={t.chat.placeholder}
            onChange={(e) => {
              setInput(e.target.value);
              const el = e.target;
              el.style.height = 'auto';
              el.style.height = Math.min(el.scrollHeight, 72) + 'px';
            }}
            placeholder={isConversationEnded ? "Continuá por WhatsApp" : t.chat.placeholder}
            disabled={isLoading || isConversationEnded}
            rows={1}
            className="input-heartbeat"
            style={{
              flex: 1, resize: 'none', overflowY: 'auto',
              border: isConversationEnded ? '1px solid var(--gray-4)' : (inputFocused ? '2px solid #10b981' : '1px solid var(--gray-6)'),
              boxShadow: inputFocused && !isConversationEnded ? '0 0 0 3px rgba(16,185,129,0.25)' : undefined,
              borderRadius: '1rem', padding: inputFocused && !isConversationEnded ? 'calc(0.5rem - 1px) calc(0.85rem - 1px)' : '0.5rem 0.85rem',
              fontSize: '0.9375rem', lineHeight: '1.5', outline: 'none', background: isConversationEnded ? 'var(--slate-2)' : 'white',
              minHeight: '2.5rem', maxHeight: '4.5rem', transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
              opacity: isConversationEnded ? 0.7 : 1,
              cursor: isConversationEnded ? 'not-allowed' : 'text',
            }}
            onFocus={() => { if (!isConversationEnded) { setInputFocused(true); trackChatFocus(); } }}
            onBlur={() => setInputFocused(false)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !isConversationEnded) {
                e.preventDefault();
                handleSend();
                (e.target as HTMLTextAreaElement).style.height = 'auto';
              }
            }}
          />
          <button
            onClick={() => { if (!isConversationEnded) { handleSend(); if (textareaRef.current) textareaRef.current.style.height = 'auto'; } }}
            disabled={isLoading || !input.trim() || isConversationEnded}
            aria-label="Enviar mensaje"
            className="w-10 h-10 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center flex-shrink-0 mb-0.5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={16} />
          </button>
        </div>
      </div>

      {/* Fallback buttons — shown below input when there's an error */}
      {error && !isLoading && (
        <div className="flex-shrink-0 flex flex-col gap-2 px-4 pb-4 bg-white">
          <p className="text-xs text-gray-500 text-center">¿Preferís otra vía?</p>
          <div className="flex gap-2">
            <button onClick={() => { trackLeadFormOpen('chat-error'); setFormOpen(true); }} className="flex-1 inline-flex items-center justify-center gap-1.5 bg-gradient-to-r from-[var(--accent-9)] to-[var(--teal-9)] text-white text-xs font-semibold px-3 py-2 rounded-full cursor-pointer">
              <User size={13} /> Te contactamos
            </button>
            <button onClick={openCalModal} className="flex-1 inline-flex items-center justify-center gap-1.5 border border-gray-200 bg-white text-gray-700 text-xs font-medium px-3 py-2 rounded-full cursor-pointer">
              <CalendarDays size={13} className="text-teal-600" /> Turno gratis
            </button>
            <button onClick={() => openMailCompose('angelyocca@hotmail.com', 'Consulta desde DefensaYa', 'Hola, necesito orientación sobre un reclamo de consumidor.')} className="flex-1 inline-flex items-center justify-center gap-1.5 border border-gray-200 bg-white text-gray-700 text-xs font-medium px-3 py-2 rounded-full cursor-pointer">
              <Mail size={13} className="text-blue-500" /> Email
            </button>
          </div>
        </div>
      )}

      <LeadForm open={formOpen} onOpenChange={setFormOpen} />
    </div>
  );
}
