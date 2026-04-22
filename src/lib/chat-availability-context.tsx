'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';

interface ChatAvailabilityContextValue {
  chatAvailable: boolean;
  resetKey: number;
  resetConversation: () => void;
  isConversationEnded: boolean;
  markConversationEnded: () => void;
  /** True when the user has exhausted their 3 daily free conversations. */
  isRateLimited: boolean;
  markRateLimited: () => void;
}

const ChatAvailabilityContext = createContext<ChatAvailabilityContextValue>({
  chatAvailable: true,
  resetKey: 0,
  resetConversation: () => {},
  isConversationEnded: false,
  markConversationEnded: () => {},
  isRateLimited: false,
  markRateLimited: () => {},
});

export function useChatAvailability() {
  return useContext(ChatAvailabilityContext);
}

export function ChatAvailabilityProvider({ children }: { children: React.ReactNode }) {
  const [resetKey, setResetKey] = useState(0);
  const [isConversationEnded, setIsConversationEnded] = useState(false);
  const [isRateLimited, setIsRateLimited] = useState(false);

  const resetConversation = useCallback(() => {
    setResetKey((k) => k + 1);
    setIsConversationEnded(false);
    // NOTE: isRateLimited intentionally NOT reset — the limit persists until server lifts it
  }, []);

  const markConversationEnded = useCallback(() => setIsConversationEnded(true), []);
  const markRateLimited = useCallback(() => setIsRateLimited(true), []);

  const value = useMemo(
    () => ({ chatAvailable: true, resetKey, resetConversation, isConversationEnded, markConversationEnded, isRateLimited, markRateLimited }),
    [resetKey, resetConversation, isConversationEnded, markConversationEnded, isRateLimited, markRateLimited],
  );

  return (
    <ChatAvailabilityContext.Provider value={value}>
      {children}
    </ChatAvailabilityContext.Provider>
  );
}
