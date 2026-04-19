'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';

interface ChatAvailabilityContextValue {
  chatAvailable: boolean;
  setChatUnavailable: () => void;
}

const ChatAvailabilityContext = createContext<ChatAvailabilityContextValue>({
  chatAvailable: true,
  setChatUnavailable: () => {},
});

export function useChatAvailability() {
  return useContext(ChatAvailabilityContext);
}

export function ChatAvailabilityProvider({ children }: { children: React.ReactNode }) {
  const [chatAvailable, setChatAvailable] = useState(true);
  const setChatUnavailable = useCallback(() => setChatAvailable(false), []);
  const value = useMemo(
    () => ({ chatAvailable, setChatUnavailable }),
    [chatAvailable, setChatUnavailable],
  );
  return (
    <ChatAvailabilityContext.Provider value={value}>
      {children}
    </ChatAvailabilityContext.Provider>
  );
}
