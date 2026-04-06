'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useEffect, useRef, useState } from 'react';
import { Avatar, Button, IconButton, ScrollArea } from '@radix-ui/themes';
import { Send, User, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
  console.log('MSG PARTS:', JSON.stringify(message.parts));
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
    <div className="flex items-end gap-2 mb-4">
      <BotAvatar />
      <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 text-sm shadow-sm" style={{ border: '1px solid var(--slate-4)', color: 'var(--slate-11)' }}>
        <span className="flex items-center gap-2">
          <span className="text-xs" style={{ color: 'var(--slate-9)' }}>{label}</span>
          <span className="flex gap-0.5">
            <span className="animate-bounce w-1.5 h-1.5 rounded-full inline-block" style={{ background: 'var(--accent-9)', animationDelay: '0ms' }} />
            <span className="animate-bounce w-1.5 h-1.5 rounded-full inline-block" style={{ background: 'var(--accent-9)', animationDelay: '150ms' }} />
            <span className="animate-bounce w-1.5 h-1.5 rounded-full inline-block" style={{ background: 'var(--accent-9)', animationDelay: '300ms' }} />
          </span>
        </span>
      </div>
    </div>
  );
}

function useTypewriter(text: string, speed = 22) {
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
  const { messages, sendMessage, status } = useChat({
    transport: chatTransport,
  });

  const [input, setInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [inputFocused, setInputFocused] = useState(false);
  const isLoading = status === 'submitted' || status === 'streaming';
  const { displayed: welcomeText, done: welcomeDone } = useTypewriter(t.chat.welcome, 22);

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
      <ScrollArea ref={scrollViewportRef} className="flex-1" style={{ minHeight: 0, background: 'var(--slate-2)' }} scrollbars="vertical">
        <div className="px-4 py-5">
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
                <Button
                  key={suggestion}
                  size="1"
                  variant="outline"
                  color="green"
                  radius="full"
                  onClick={() => handleSend(suggestion)}
                >
                  {suggestion}
                </Button>
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
                  <Avatar size="2" radius="full" color="gray" fallback={<User size={14} />} />
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
        </div>
      </ScrollArea>

      {/* Hint bar — visible before first message, inside the card */}
      <AnimatePresence>
        {showSuggestions && messages.length === 0 && (
          <motion.div
            key="hint"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 2.5, duration: 0.5 }}
            className="flex-shrink-0 flex justify-center py-2 bg-slate-50 border-t border-slate-100"
          >
            <button
              onClick={focusInput}
              className="text-xs text-slate-400 flex items-center gap-1.5 hover:text-slate-600 transition-colors"
            >
              <span className="animate-bounce inline-block">👇</span>
              {t.chat.hintText}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input area */}
      <div className="flex-shrink-0 px-4 py-3 bg-white" style={{ borderTop: '1px solid var(--slate-4)' }}>
        <div className="flex items-end gap-2">
          <textarea
            id="chat-input"
            ref={textareaRef}
            value={input}
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
              border: '1px solid var(--gray-6)',
              borderRadius: '1rem',
              padding: '0.5rem 0.85rem',
              fontSize: '0.9375rem',
              lineHeight: '1.5',
              outline: 'none',
              background: 'white',
              minHeight: '2.5rem',
              maxHeight: '4.5rem',
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
          <IconButton
            onClick={() => {
              handleSend();
              if (textareaRef.current) textareaRef.current.style.height = 'auto';
            }}
            disabled={isLoading || !input.trim()}
            size="3"
            radius="full"
            color="green"
            style={{ flexShrink: 0, marginBottom: '0.125rem' }}
          >
            <Send size={16} />
          </IconButton>
        </div>
      </div>
    </div>
  );
}
