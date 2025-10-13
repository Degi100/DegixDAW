// src/contexts/ChatContext.tsx
// Global Chat Context for Sidebar Management

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

interface ChatContextType {
  isChatOpen: boolean;
  openChat: (userId?: string) => void;
  closeChat: () => void;
  toggleChat: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

interface ChatProviderProps {
  children: ReactNode;
}

export function ChatProvider({ children }: ChatProviderProps) {
  const [isChatOpen, setIsChatOpen] = useState(false);

  const openChat = useCallback((userId?: string) => {
    setIsChatOpen(true);
    // TODO: If userId provided, start chat with that user
    if (userId) {
      console.log('Starting chat with user:', userId);
    }
  }, []);

  const closeChat = useCallback(() => {
    setIsChatOpen(false);
  }, []);

  const toggleChat = useCallback(() => {
    setIsChatOpen(prev => !prev);
  }, []);

  return (
    <ChatContext.Provider value={{
      isChatOpen,
      openChat,
      closeChat,
      toggleChat,
    }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
