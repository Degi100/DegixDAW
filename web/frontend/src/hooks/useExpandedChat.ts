import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Message } from './useMessages';

/**
 * Props for the useExpandedChat hook
 */
interface UseExpandedChatProps {
  expandedChatId: string | null;
  currentUserId: string | null;
  historyContainerRef: React.RefObject<HTMLDivElement | null>;
  historyEndRef: React.RefObject<HTMLDivElement | null>;
  playMessageReceived: () => void;
  success: (message: string) => void;
}

/**
 * Custom hook for managing expanded chat state and interactions
 *
 * Handles message display, sending, scrolling, and real-time updates for the currently expanded chat.
 *
 * @param props - Hook configuration
 * @returns Object containing chat state and handlers
 */
export function useExpandedChat({
  expandedChatId,
  currentUserId,
  historyContainerRef,
  historyEndRef,
  playMessageReceived,
  success,
}: UseExpandedChatProps) {
  const [messageText, setMessageText] = useState<string>('');
  const [isSendingMessage, setIsSendingMessage] = useState<boolean>(false);
  const [chatMessages, setChatMessages] = useState<Record<string, Message[]>>({});
  const [showScrollButton, setShowScrollButton] = useState<Record<string, boolean>>({});

  // Load messages on chat expansion
  useEffect(() => {
    if (!expandedChatId || chatMessages[expandedChatId]) return;
    const loadMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', expandedChatId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true })
        .limit(20);
      if (data) {
        setChatMessages(prev => ({ ...prev, [expandedChatId]: data }));
        setShowScrollButton(prev => ({ ...prev, [expandedChatId]: false }));
        // Instant scroll to bottom on first load
        setTimeout(() => {
          historyEndRef.current?.scrollIntoView({ behavior: 'instant' });
        }, 50);
      }
    };
    loadMessages();
  }, [expandedChatId, chatMessages, historyEndRef]);

  // Real-time message subscription
  useEffect(() => {
    if (!expandedChatId) return;
    const channel = supabase
      .channel(`messages:${expandedChatId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${expandedChatId}`
      }, (payload: unknown) => {
        const p = payload as { new: Message };
        setChatMessages(prev => ({
          ...prev,
          [expandedChatId]: [...(prev[expandedChatId] || []), p.new]
        }));

        // Wenn nicht der eigene Benutzer, Sound abspielen
        if (p.new.sender_id !== currentUserId) {
          playMessageReceived();
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [expandedChatId, currentUserId, playMessageReceived]);

  // Auto-scroll to bottom when new messages arrive (only if user is at bottom)
  useEffect(() => {
    if (expandedChatId && chatMessages[expandedChatId]) {
      const isAtBottom = !showScrollButton[expandedChatId];
      if (isAtBottom) {
        setTimeout(() => {
          historyEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 50);
      }
    }
  }, [chatMessages, expandedChatId, showScrollButton, historyEndRef]);

  const handleSendQuickMessage = useCallback(async (chatId: string, text: string) => {
    if (!text.trim() || isSendingMessage || !currentUserId) return;
    setIsSendingMessage(true);
    try {
      const content = text.trim();
      // Text wird in der Komponente geleert
      
      await supabase.from('messages').insert({
        conversation_id: chatId,
        sender_id: currentUserId,
        content: content,
        message_type: 'text'
      });
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsSendingMessage(false);
    }
  }, [isSendingMessage, currentUserId]);

  const handleFileUpload = useCallback(async (chatId: string, file: File) => {
    if (!currentUserId) return;
    setIsSendingMessage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('message-attachments')
        .upload(`${currentUserId}/${fileName}`, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('message-attachments').getPublicUrl(uploadData.path);
      const messageType = file.type.startsWith('audio/') ? 'voice' : file.type.startsWith('video/') ? 'video' : file.type.startsWith('image/') ? 'video' : file.type.startsWith('image/') ? 'image' : 'file';
      await supabase.from('messages').insert({
        conversation_id: chatId,
        sender_id: currentUserId,
        content: publicUrl,
        message_type: messageType,
        metadata: { fileName: file.name, fileSize: file.size, fileType: file.type }
      });
      success(`${file.name} gesendet!`);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsSendingMessage(false);
    }
  }, [currentUserId, success]);

  const handleScroll = useCallback((chatId: string) => {
    const container = historyContainerRef.current;
    if (!container) return;
    const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 50;
    setShowScrollButton(prev => ({ ...prev, [chatId]: !isAtBottom }));
  }, [historyContainerRef]);

  const scrollToBottom = useCallback((chatId: string) => {
    historyEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setShowScrollButton(prev => ({ ...prev, [chatId]: false }));
  }, [historyEndRef]);

  return {
    chatMessages,
    messageText,
    setMessageText,
    isSendingMessage,
    showScrollButton,
    handleSendQuickMessage,
    handleFileUpload,
    handleScroll,
    scrollToBottom,
  };
}