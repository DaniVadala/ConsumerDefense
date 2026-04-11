'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useEffect, useId, useRef, useState } from 'react';
import { Send, User, Shield } from 'lucide-react';
import { DiagnosticCard } from './diagnostic-card';
import { useLocale } from '@/lib/i18n/context';
import type { UIMessage } from 'ai';

const chatTransport = new DefaultChatTransport({ api: '/api/chat' });

interface DiagnosticData {
  diagnostic: true;
  category: string;
  provider: string;
  relevance: 'RELEVANTE' | 'REQUIERE ANÁLISIS' | 'FUERA DE ALCANCE';
  summary: string;
  applicableLaws: string[];
  legalContext: string;
  nextSteps: string[];
}

function getMessageText(message: UIMessage): string {
  return message.parts
    .filter((p) => p.type === 'text')
    .map((p) => (p as { type: 'text'; text: string }).text)
    .join('');
}

function parseDiagnostic(content: string): DiagnosticData | null {
  const match = content.match(/```json\s*([\s\S]*?)\s*```/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[1]);
    if (parsed.diagnostic === true) return parsed as DiagnosticData;
    return null;
  } catch {
    return null;
  }
}

function stripDiagnosticJson(content: string): string {
  return content.replace(/```json\s*[\s\S]*?\s*```/, '').trim();
}

/** Strip incomplete JSON fences that are still streaming (no closing ```) */
function stripPartialJson(content: string): string {
  return content.replace(/```json[\s\S]*$/, '').trim();
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
    // A11Y: role=status + aria-live so screen readers announce typing state
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
      if (i >= text.length) {
        clearInterval(id);
        setDone(true);
      }
    }, speed);
    return () => clearInterval(id);
  }, [text, speed]);
  return { displayed, done };
}

export function ChatWidget() {
  const { t } = useLocale();
  // A11Y: unique ID per ChatWidget instance to avoid duplicate id="chat-input"
  const instanceId = useId();
  const inputId = `chat-input-${instanceId}`;
  const { messages, sendMessage, status, error } = useChat({
    transport: chatTransport,
  });

  const [input, setInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [inputFocused, setInputFocused] = useState(false);
  const isLoading = status === 'submitted' || status === 'streaming';
  const { displayed: welcomeText, done: welcomeDone } = useTypewriter(t.chat.welcome, 8);

  const containerRef = useRef<HTMLDivElement>(null);
  const scrollViewportRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    const el = scrollViewportRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  };

  // Scroll when new messages arrive or while streaming (content grows)
  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = (text?: string) => {
    const message = (text ?? input).trim();
    if (!message || isLoading) return;
    setInput('');
    setShowSuggestions(false);
    sendMessage({ text: message });
  };

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const focusInput = () => textareaRef.current?.focus();

  return (
    <div
      id="chat-widget"
      ref={containerRef}
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
        <div className="ml-auto flex items-center gap-2 rounded-full px-3 py-1 transition-colors duration-300" style={{ background: 'rgba(255,255,255,0.15)' }}>
          <div
            className="w-2.5 h-2.5 rounded-full animate-pulse"
            style={{ background: inputFocused ? '#ef4444' : 'var(--green-4)', transition: 'background 0.3s' }}
          />
          <span className="text-xs text-white/90 font-medium transition-all duration-300">
            {inputFocused ? 'En vivo' : 'En línea'}
          </span>
        </div>
      </div>

      {/* Messages area */}
      <div ref={scrollViewportRef} className="flex-1 overflow-y-auto" style={{ minHeight: 0, background: 'var(--slate-2)' }}>
        {/* A11Y: aria-live region so screen readers announce new messages */}
        <div className="px-4 py-5" aria-live="polite" aria-relevant="additions">
          {/* Welcome message */}
          <div className="flex items-end gap-2 mb-4">
            <BotAvatar />
            <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 text-sm max-w-[85%] leading-relaxed shadow-sm" style={{ border: '1px solid var(--slate-4)', color: 'var(--slate-12)' }}>
              {welcomeText}
              {!welcomeDone && (
                <span className="inline-block w-0.5 h-3.5 bg-current align-middle ml-0.5 animate-[blink_0.9s_step-end_infinite]" />
              )}
            </div>
          </div>

          {/* Quick-suggestion chips */}
          {showSuggestions && messages.length === 0 && (
            <div className="flex flex-wrap gap-2 mb-5 pl-10">
              {t.chat.suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => handleSend(suggestion)}
                  className="text-xs font-medium px-3 py-1.5 rounded-full border border-emerald-300 text-emerald-700 bg-white hover:bg-emerald-50 transition-colors cursor-pointer"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}

          {messages.map((message, idx) => {
            const isUser = message.role === 'user';
            const rawText = getMessageText(message);
            const isLastAssistant = !isUser && idx === messages.length - 1 && status === 'streaming';

            if (isUser) {
              return (
                <div key={message.id} className="flex items-end justify-end gap-2 mb-4">
                  <div className="text-white rounded-2xl rounded-br-sm px-4 py-3 text-sm max-w-[85%] leading-relaxed shadow-sm" style={{ background: 'var(--accent-9)' }}>
                    {rawText}
                  </div>
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                    <User size={14} className="text-gray-500" />
                  </div>
                </div>
              );
            }

            const diagnostic = parseDiagnostic(rawText);
            // While streaming, hide the partial JSON fence that hasn't closed yet
            const text = isLastAssistant && !diagnostic ? stripPartialJson(rawText) : rawText;
            const textContent = diagnostic ? stripDiagnosticJson(text) : text;

            return (
              <div key={message.id} className="flex items-end gap-2 mb-4">
                <div className="flex-shrink-0 self-start mt-1">
                  <BotAvatar />
                </div>
                <div className="max-w-[85%] space-y-2">
                  {textContent && (
                    <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap shadow-sm" style={{ border: '1px solid var(--slate-4)', color: 'var(--slate-12)' }}>
                      {textContent}
                    </div>
                  )}
                  {diagnostic && <DiagnosticCard data={diagnostic} />}
                </div>
              </div>
            );
          })}

          {isLoading && <TypingIndicator label={t.chat.typing} />}

          {/* DATA-RELIABILITY: Show error to user when chat stream fails */}
          {error && (
            <div className="mx-2 mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700" role="alert">
              Hubo un error al procesar tu mensaje. Intentá de nuevo.
            </div>
          )}
        </div>
      </div>

      {/* Hint bar — visible before first message, inside the card */}
      {showSuggestions && messages.length === 0 && (
          <div
            className="flex-shrink-0 flex justify-center py-2 bg-slate-50 border-t border-slate-100"
          >
            <button
              onClick={focusInput}
              className="text-xs text-slate-400 flex items-center gap-1.5 hover:text-slate-600 transition-colors"
            >
              <span className="animate-bounce inline-block">👇</span>
              {t.chat.hintText}
            </button>
          </div>
      )}

      {/* Input area */}
      <div className="flex-shrink-0 px-4 py-3 bg-white" style={{ borderTop: '1px solid var(--slate-4)' }}>
        <div className="flex items-end gap-2">
          <textarea
            id={inputId}
            data-chat-input
            ref={textareaRef}
            value={input}
            aria-label={t.chat.placeholder}
            onChange={(e) => {
              setInput(e.target.value);
              // auto-resize up to 3 lines
              const el = e.target;
              el.style.height = 'auto';
              el.style.height = Math.min(el.scrollHeight, 72) + 'px';
            }}
            placeholder={t.chat.placeholder}
            disabled={isLoading}
            rows={1}
            className="input-heartbeat"
            style={{
              flex: 1,
              resize: 'none',
              overflowY: 'auto',
              border: inputFocused ? '2px solid #10b981' : '1px solid var(--gray-6)',
              boxShadow: inputFocused ? '0 0 0 3px rgba(16,185,129,0.25), 0 0 10px 2px rgba(16,185,129,0.15)' : undefined,
              borderRadius: '1rem',
              padding: inputFocused ? 'calc(0.5rem - 1px) calc(0.85rem - 1px)' : '0.5rem 0.85rem',
              fontSize: '0.9375rem',
              lineHeight: '1.5',
              outline: 'none',
              background: 'white',
              minHeight: '2.5rem',
              maxHeight: '4.5rem',
              transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
            }}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
                // reset height after send
                const el = e.target as HTMLTextAreaElement;
                el.style.height = 'auto';
              }
            }}
          />
          <button
            onClick={() => {
              handleSend();
              if (textareaRef.current) textareaRef.current.style.height = 'auto';
            }}
            disabled={isLoading || !input.trim()}
            aria-label="Enviar mensaje"
            className="w-10 h-10 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center flex-shrink-0 mb-0.5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
