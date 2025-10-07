import { useState } from 'react';

/**
 * Hook for managing UI state related to chat interactions
 * Handles selected chat, expanded chat, and attach menu visibility
 */
export function useChatUIState() {
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [expandedChatId, setExpandedChatId] = useState<string | null>(null);
  const [showAttachMenu, setShowAttachMenu] = useState<boolean>(false);

  const toggleAttachMenu = () => {
    setShowAttachMenu(prev => !prev);
  };

  return {
    selectedChat,
    setSelectedChat,
    expandedChatId,
    setExpandedChatId,
    showAttachMenu,
    setShowAttachMenu,
    toggleAttachMenu,
  };
}