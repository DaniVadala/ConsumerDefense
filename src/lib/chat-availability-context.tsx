'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';

interface ChatAvailabilityContextValue {
  chatAvailable: boolean;
  setChatUnavailable: () => void;
  conversationEnded: boolean;
  setConversationEnded: (v: boolean) => void;
  resetKey: number;
  resetConversation: () => void;
}

const ChatAvailabilityContext = createContext<ChatAvailabilityContextValue>({
  chatAvailable: true,
  setChatUnavailable: () => {},
  conversationEnded: false,
  setConversationEnded: () => {},
  resetKey: 0,
  resetConversation: () => {},
});

export function useChatAvailability() {
  return useContext(ChatAvailabilityContext);
}

export function ChatAvailabilityProvider({ children }: { children: React.ReactNode }) {
  const [chatAvailable, setChatAvailable] = useState(true);
  const [conversationEnded, setConversationEnded] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  const setChatUnavailable = useCallback(() => setChatAvailable(false), []);

  const resetConversation = useCallback(() => {
    setConversationEnded(false);
    setResetKey((k) => k + 1);
  }, []);

  const value = useMemo(
    () => ({ chatAvailable, setChatUnavailable, conversationEnded, setConversationEnded, resetKey, resetConversation }),
    [chatAvailable, setChatUnavailable, conversationEnded, resetKey, resetConversation],
  );
  return (
    <ChatAvailabilityContext.Provider value={value}>
      {children}
    </ChatAvailabilityContext.Provider>
  );
}
