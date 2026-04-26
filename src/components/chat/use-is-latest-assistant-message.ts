'use client';

import { useState, useEffect } from 'react';
import { useMessage, useThreadRuntime } from '@assistant-ui/react';

/** True si este mensaje es el último del asistente en el hilo. */
export function useIsLatestAssistantMessage(): boolean {
  const message = useMessage();
  const threadRuntime = useThreadRuntime();
  const [yes, setYes] = useState(true);
  useEffect(() => {
    const sync = () => {
      const msgs = threadRuntime.getState().messages;
      const lastA = [...msgs].reverse().find((m) => m.role === 'assistant');
      setYes(!!lastA && lastA.id === message.id);
    };
    sync();
    return threadRuntime.subscribe(sync);
  }, [threadRuntime, message.id]);
  return yes;
}
