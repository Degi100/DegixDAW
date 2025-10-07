import { useCallback } from 'react';
import { useConversations } from './useConversations';
import { useDebouncedAsync } from './useDebouncedAsync';
import { supabase } from '../lib/supabase';

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
  currentUserId,
}: {
  allChats: Array<{ id: string; name: string; unreadCount: number; isExistingConversation: boolean; friendId?: string }>;
  expandedChatId: string | null;
  setExpandedChatId: (id: string | null) => void;
  setSelectedChat: (id: string | null) => void;
  playMessageReceived: () => void;
  createOrOpenDirectConversation: (friendId: string) => Promise<string | null>;
  success: (message: string) => void;
  loadConversations: () => Promise<void>;
  messageText: string;
  setMessageText: (text: string) => void;
  expandedChatHandleSend: (text: string) => Promise<void>;
  setShowAttachMenu: (show: boolean) => void;
  expandedChatHandleUpload: (chatId: string, file: File) => Promise<void>;
  currentUserId: string | null;
}) {
  // Conversations-Hook für optimistisches UI-Update
  const { optimisticallyMarkAsRead } = useConversations();

  // Debounced markConversationAsRead (pro ChatId)
  const markConversationAsRead = useDebouncedAsync(
    async (chatId: string) => {
      console.log('🔍 markConversationAsRead called for chatId:', chatId);
      if (!currentUserId) {
        console.log('⚠️ Skipping: no currentUserId');
        return;
      }
      console.log('💾 Updating DB for chat:', chatId);
      const { error } = await supabase
        .from('conversation_members') 
        .update({ last_read_at: new Date().toISOString() })
        .eq('conversation_id', chatId)
        .eq('user_id', currentUserId);
      if (error) {
        console.error('❌ Fehler beim Markieren als gelesen:', error);
        return;
      }
      console.log('✅ DB update successful, reloading conversations...');
      await loadConversations();
      console.log('🎉 Conversations reloaded');
    },
    300
  );

  const handleChatSelect = useCallback(async (chatId: string) => {
    if (expandedChatId === chatId) {
      setExpandedChatId(null);
      return;
    }
    
    // UI-State setzen, damit der Chat sofort im Frontend erscheint
  setExpandedChatId(chatId);
  setSelectedChat(chatId);

  // Optimistisches UI-Update: Badge sofort ausblenden
  optimisticallyMarkAsRead(chatId);

  // Asynchron: Backend-Update (key = chatId für Debounce pro Chat)
  await markConversationAsRead(chatId, chatId);

    // --- Bestehende Logik (zurückgezogen von der MarkAsRead-Logik) ---
    const chat = allChats.find(c => c.id === chatId);
    if (!chat) return;

    // Sound abspielen, falls Ungelesenes existiert (muss vor dem DB-Update gecheckt werden, 
    // falls der Sound nur beim ersten Mal kommen soll)
    if (chat.unreadCount > 0) playMessageReceived(); 
    
    // ... (Logik zum Erstellen neuer Konversationen bleibt unverändert) ...
    if (!chat.isExistingConversation && chat.friendId) {
      try {
        const conversationId = await createOrOpenDirectConversation(chat.friendId);
        if (conversationId) {
          success(`Chat mit ${chat.name} gestartet!`);
          // Update UI state to use the real conversation ID
          setExpandedChatId(conversationId);
          setSelectedChat(conversationId);
          await loadConversations();
        }
      } catch (error) {
        console.error('Error:', error);
      }
    }
  }, [expandedChatId, allChats, playMessageReceived, setExpandedChatId, setSelectedChat, markConversationAsRead, createOrOpenDirectConversation, success, loadConversations, optimisticallyMarkAsRead]);

  const handleSendQuickMessage = useCallback(async () => {
    const textToSend = messageText;
    setMessageText(''); // Sofort Input leeren für besseres UX
    await expandedChatHandleSend(textToSend);
  }, [messageText, setMessageText, expandedChatHandleSend]);

  const handleFileUpload = useCallback(async (chatId: string, file: File) => {
    setShowAttachMenu(false);
    await expandedChatHandleUpload(chatId, file);
  }, [setShowAttachMenu, expandedChatHandleUpload]);

  const clearChatHistory = useCallback(async (chatId: string) => {
    console.log('🗑️ Clearing chat history for chatId:', chatId);
    
    try {
      // 1. Get all message IDs for this conversation
      const { data: messages, error: fetchError } = await supabase
        .from('messages')
        .select('id')
        .eq('conversation_id', chatId);

      if (fetchError) {
        console.error('❌ Error fetching messages:', fetchError);
        return;
      }

      const messageIds = messages?.map(m => m.id) || [];

      // 2. Delete attachments for these messages (hard delete)
      if (messageIds.length > 0) {
        const { error: attachmentsError } = await supabase
          .from('message_attachments')
          .delete()
          .in('message_id', messageIds);

        if (attachmentsError) {
          console.error('❌ Error clearing attachments:', attachmentsError);
          // Continue anyway
        }
      }

      // 3. Mark messages as deleted (soft delete)
      const { error: messagesError } = await supabase
        .from('messages')
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
          content: null,
        })
        .eq('conversation_id', chatId);

      if (messagesError) {
        console.error('❌ Error clearing messages:', messagesError);
        return;
      }

      console.log('✅ Chat history cleared successfully');
      success('Chatverlauf gelöscht');
      
      // Reload conversations to update UI
      await loadConversations();
    } catch (err) {
      console.error('Error clearing chat history:', err);
    }
  }, [success, loadConversations]);

  // Wrapper für markConversationAsRead, damit die Signatur stimmt (nur chatId)
  const markAsRead = useCallback(async (chatId: string) => {
    return markConversationAsRead(chatId, chatId);
  }, [markConversationAsRead]);

  return {
    handleChatSelect,
    handleSendQuickMessage,
    handleFileUpload,
    clearChatHistory,
    markConversationAsRead: markAsRead,
  };
}