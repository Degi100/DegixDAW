import { useCallback } from 'react';

/**
 * Hook for coordinating chat interactions and business logic
 */
export function useChatCoordination({
  allChats,
  expandedChatId,
  setExpandedChatId,
  setSelectedChat,
  playMessageReceived,
  createOrOpenDirectConversation,
  success,
  loadConversations,
  messageText,
  setMessageText,
  expandedChatHandleSend,
  setShowAttachMenu,
  expandedChatHandleUpload,
}: {
  allChats: any[];
  expandedChatId: string | null;
  setExpandedChatId: (id: string | null) => void;
  setSelectedChat: (id: string | null) => void;
  playMessageReceived: () => void;
  createOrOpenDirectConversation: (friendId: string) => Promise<string | null>;
  success: (message: string) => void;
  loadConversations: () => Promise<void>;
  messageText: string;
  setMessageText: (text: string) => void;
  expandedChatHandleSend: (chatId: string, text: string) => Promise<void>;
  setShowAttachMenu: (show: boolean) => void;
  expandedChatHandleUpload: (chatId: string, file: File) => Promise<void>;
}) {
  const handleChatSelect = useCallback(async (chatId: string) => {
    if (expandedChatId === chatId) {
      setExpandedChatId(null);
      return;
    }
    setExpandedChatId(chatId);
    setSelectedChat(chatId);
    const chat = allChats.find(c => c.id === chatId);
    if (!chat) return;
    if (chat.unreadCount > 0) playMessageReceived();
    if (!chat.isExistingConversation && chat.friendId) {
      try {
        const conversationId = await createOrOpenDirectConversation(chat.friendId);
        if (conversationId) {
          success(`Chat mit ${chat.name} gestartet!`);
          await loadConversations();
        }
      } catch (error) {
        console.error('Error:', error);
      }
    }
  }, [expandedChatId, allChats, playMessageReceived, createOrOpenDirectConversation, success, loadConversations, setExpandedChatId, setSelectedChat]);

  const handleSendQuickMessage = useCallback(async (chatId: string) => {
    const textToSend = messageText;
    setMessageText(''); // Sofort Input leeren für besseres UX
    await expandedChatHandleSend(chatId, textToSend);
  }, [messageText, setMessageText, expandedChatHandleSend]);

  const handleFileUpload = useCallback(async (chatId: string, file: File) => {
    setShowAttachMenu(false);
    await expandedChatHandleUpload(chatId, file);
  }, [setShowAttachMenu, expandedChatHandleUpload]);

  const totalUnreadCount = allChats.reduce((sum, chat) => sum + chat.unreadCount, 0);

  return {
    handleChatSelect,
    handleSendQuickMessage,
    handleFileUpload,
    totalUnreadCount,
  };
}