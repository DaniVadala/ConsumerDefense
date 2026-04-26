'use client';

import { useState, useEffect } from 'react';
import { IntakeFlow } from '@/components/chat/intake-flow';

function newSessionId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
    });
  }
}

export function ChatContainer() {
  const [sessionId] = useState<string>(newSessionId);
  const [bypassToken, setBypassToken] = useState<string | undefined>(undefined);

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
      // sessionStorage unavailable — ignore
    }
  }, []);

  return <IntakeFlow sessionId={sessionId} bypassToken={bypassToken} />;
}
