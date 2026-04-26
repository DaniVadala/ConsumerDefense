'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';

interface ChatAvailabilityContextValue {
  chatAvailable: boolean;
  resetKey: number;
  resetConversation: () => void;
  isConversationEnded: boolean;
  markConversationEnded: () => void;
  /** True when the user has exhausted their daily free conversations. */
  isRateLimited: boolean;
  markRateLimited: () => void;
  /**
   * Set when a conversation ends in a way that should replace the hero CTA
   * with a WhatsApp button (non-conducive max, abusive, stuck, etc.).
   * Null means the conversation ended cleanly (completed diagnosis).
   */
  heroWhatsAppReason: string | null;
  markConversationEndedWithHeroWhatsApp: (reason: string) => void;
}

const ChatAvailabilityContext = createContext<ChatAvailabilityContextValue>({
  chatAvailable: true,
  resetKey: 0,
  resetConversation: () => {},
  isConversationEnded: false,
  markConversationEnded: () => {},
  isRateLimited: false,
  markRateLimited: () => {},
  heroWhatsAppReason: null,
  markConversationEndedWithHeroWhatsApp: () => {},
});

export function useChatAvailability() {
  return useContext(ChatAvailabilityContext);
}

export function ChatAvailabilityProvider({ children }: { children: React.ReactNode }) {
  const [resetKey, setResetKey] = useState(0);
  const [isConversationEnded, setIsConversationEnded] = useState(false);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [heroWhatsAppReason, setHeroWhatsAppReason] = useState<string | null>(null);

  const resetConversation = useCallback(() => {
    setResetKey((k) => k + 1);
    setIsConversationEnded(false);
    setHeroWhatsAppReason(null);
    // NOTE: isRateLimited intentionally NOT reset — the limit persists until server lifts it
  }, []);

  const markConversationEnded = useCallback(() => setIsConversationEnded(true), []);
  const markRateLimited = useCallback(() => setIsRateLimited(true), []);
  const markConversationEndedWithHeroWhatsApp = useCallback((reason: string) => {
    setIsConversationEnded(true);
    setHeroWhatsAppReason(reason);
  }, []);

  const value = useMemo(
    () => ({
      chatAvailable: true,
      resetKey,
      resetConversation,
      isConversationEnded,
      markConversationEnded,
      isRateLimited,
      markRateLimited,
      heroWhatsAppReason,
      markConversationEndedWithHeroWhatsApp,
    }),
    [resetKey, resetConversation, isConversationEnded, markConversationEnded, isRateLimited, markRateLimited, heroWhatsAppReason, markConversationEndedWithHeroWhatsApp],
  );

  return (
    <ChatAvailabilityContext.Provider value={value}>
      {children}
    </ChatAvailabilityContext.Provider>
  );
}
