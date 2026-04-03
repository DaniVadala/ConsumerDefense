'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useEffect, useRef, useState } from 'react';
import { Avatar, Button, IconButton, ScrollArea, TextField } from '@radix-ui/themes';
import { Send, User, Shield } from 'lucide-react';
import { DiagnosticCard } from './diagnostic-card';
import type { UIMessage } from 'ai';

const chatTransport = new DefaultChatTransport({ api: '/api/chat' });

interface DiagnosticData {
  diagnostic: true;
  category: string;
  provider: string;
  viability: 'ALTA' | 'MEDIA' | 'BAJA';
  summary: string;
  applicableLaws: string[];
  estimatedDamage: string;
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

function BotAvatar() {
  return (
    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'var(--accent-9)' }}>
      <Shield className="w-4 h-4 text-white" />
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 mb-4">
      <BotAvatar />
      <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 text-sm shadow-sm" style={{ border: '1px solid var(--slate-4)', color: 'var(--slate-11)' }}>
        <span className="flex items-center gap-2">
          <span className="text-xs" style={{ color: 'var(--slate-9)' }}>DefensaYa está escribiendo</span>
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

const WELCOME_MESSAGE =
  '¡Hola! Soy DefensaYa 🤖 Contame qué problema tuviste con alguna empresa, banco o servicio, y te ayudo a entender qué podés hacer.';

const QUICK_SUGGESTIONS = [
  'Me cobraron de más',
  'No me dieron el producto',
  'Problema con garantía',
  'Cancelaron mi vuelo',
];

export function ChatWidget() {
  const { messages, sendMessage, status } = useChat({
    transport: chatTransport,
  });

  const [input, setInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(true);
  const isLoading = status === 'submitted' || status === 'streaming';

  const bottomRef = useRef<HTMLDivElement>(null);
  const prevMessagesLen = useRef(0);

  useEffect(() => {
    if (messages.length > prevMessagesLen.current) {
      prevMessagesLen.current = messages.length;
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = (text?: string) => {
    const message = (text ?? input).trim();
    if (!message || isLoading) return;
    setInput('');
    setShowSuggestions(false);
    sendMessage({ text: message });
  };

  return (
    <div className="flex flex-col h-full rounded-2xl overflow-hidden" style={{ background: 'white', border: '1px solid var(--slate-4)', boxShadow: '0 20px 40px -12px rgb(0 0 0 / 0.12)' }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 flex-shrink-0 text-white" style={{ background: 'linear-gradient(135deg, var(--accent-9), var(--teal-9))' }}>
        <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center ring-2 ring-white/30">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="font-bold text-sm leading-tight">DefensaYa</p>
          <p className="text-white/80 text-xs">Orientación gratuita al consumidor</p>
        </div>
        <div className="ml-auto flex items-center gap-2 rounded-full px-3 py-1" style={{ background: 'rgba(255,255,255,0.15)' }}>
          <div className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ background: 'var(--green-4)' }} />
          <span className="text-xs text-white/90 font-medium">En línea</span>
        </div>
      </div>

      {/* Messages area */}
      <ScrollArea className="flex-1" style={{ minHeight: 0, background: 'var(--slate-2)' }}>
        <div className="px-4 py-5">
          {/* Welcome message */}
          <div className="flex items-end gap-2 mb-4">
            <BotAvatar />
            <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 text-sm max-w-[85%] leading-relaxed shadow-sm" style={{ border: '1px solid var(--slate-4)', color: 'var(--slate-12)' }}>
              {WELCOME_MESSAGE}
            </div>
          </div>

          {/* Quick-suggestion chips */}
          {showSuggestions && messages.length === 0 && (
            <div className="flex flex-wrap gap-2 mb-5 pl-10">
              {QUICK_SUGGESTIONS.map((suggestion) => (
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

          {messages.map((message) => {
            const isUser = message.role === 'user';
            const text = getMessageText(message);

            if (isUser) {
              return (
                <div key={message.id} className="flex items-end justify-end gap-2 mb-4">
                  <div className="text-white rounded-2xl rounded-br-sm px-4 py-3 text-sm max-w-[85%] leading-relaxed shadow-sm" style={{ background: 'var(--accent-9)' }}>
                    {text}
                  </div>
                  <Avatar size="2" radius="full" color="gray" fallback={<User size={14} />} />
                </div>
              );
            }

            const diagnostic = parseDiagnostic(text);
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

          {isLoading && <TypingIndicator />}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* Input area */}
      <style>{`
        @keyframes input-pulse {
          0%, 100% { box-shadow: 0 0 0 1.5px rgba(148, 163, 184, 0.6), 0 0 0 0px rgba(16, 185, 129, 0); }
          50% { box-shadow: 0 0 0 1.5px rgba(16, 185, 129, 0.6), 0 0 8px 2px rgba(16, 185, 129, 0.15); }
        }
        .input-heartbeat:not(:focus-within) {
          animation: input-pulse 2.4s ease-in-out infinite;
        }
      `}</style>
      <div className="flex-shrink-0 px-4 py-3 bg-white" style={{ borderTop: '1px solid var(--slate-4)' }}>
        <div className="flex items-center gap-2">
          <TextField.Root
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Contame tu problema..."
            disabled={isLoading}
            radius="full"
            size="3"
            className="input-heartbeat"
            style={{ flex: 1 }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <IconButton
            onClick={() => handleSend()}
            disabled={isLoading || !input.trim()}
            size="3"
            radius="full"
            color="green"
          >
            <Send size={16} />
          </IconButton>
        </div>
      </div>
    </div>
  );
}
