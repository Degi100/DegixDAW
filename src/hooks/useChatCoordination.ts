import { useCallback } from 'react';
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
  currentUserId: string | null;
}) {
  const markConversationAsRead = useCallback(async (chatId: string) => {
    console.log('🔍 markConversationAsRead called for chatId:', chatId);
    
    // Finde den aktuellen Chat, um unnötige DB-Aufrufe zu vermeiden
    const chat = allChats.find(c => c.id === chatId);
    console.log('📊 Found chat:', chat);
    
    if (!chat || chat.unreadCount === 0) {
      console.log('⚠️ Skipping: chat not found or no unread messages');
      return;
    }

    console.log('💾 Updating DB for chat:', chatId, 'unreadCount:', chat.unreadCount);
    
    // 1. Datenbank-Update: Setze den ungelesenen Zähler auf 0.
    // **Annahme:** Es existiert eine Tabelle 'conversation_members' mit 'conversation_id' und 'user_id'.
    const { error } = await supabase
      .from('conversation_members') 
      .update({ unread_count: 0, last_read_at: new Date().toISOString() })
      .eq('conversation_id', chatId)
      .eq('user_id', currentUserId);

    if (error) {
      console.error('❌ Fehler beim Markieren als gelesen:', error);
      return;
    }

    console.log('✅ DB update successful, reloading conversations...');
    
    // 2. UI-Synchronisation: Lade die Konversationsliste neu, um die Badges zu aktualisieren (Schritt 3 & 4 der Logik).
    console.log('🔄 Calling loadConversations...');
    await loadConversations();
    
    console.log('🎉 Conversations reloaded');
  }, [allChats, currentUserId, loadConversations]);

  const handleChatSelect = useCallback(async (chatId: string) => {
    if (expandedChatId === chatId) {
      setExpandedChatId(null);
      return;
    }
    
    // UI-State setzen, damit der Chat sofort im Frontend erscheint
    setExpandedChatId(chatId);
    setSelectedChat(chatId);
    
    // NEUE LOGIK: Asynchronen Aufruf starten, um Badges zurückzusetzen
    // Wir rufen dies sofort auf, auch wenn der Rest der Logik noch läuft
    await markConversationAsRead(chatId); 

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
          await loadConversations();
        }
      } catch (error) {
        console.error('Error:', error);
      }
    }
  }, [expandedChatId, allChats, playMessageReceived, setExpandedChatId, setSelectedChat, markConversationAsRead, createOrOpenDirectConversation, success, loadConversations]);

  const handleSendQuickMessage = useCallback(async (chatId: string) => {
    const textToSend = messageText;
    setMessageText(''); // Sofort Input leeren für besseres UX
    await expandedChatHandleSend(chatId, textToSend);
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

  return {
    handleChatSelect,
    handleSendQuickMessage,
    handleFileUpload,
    clearChatHistory,
  };
}