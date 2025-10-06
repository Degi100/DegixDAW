import React, { useRef, useEffect, memo } from 'react';
import type { Message } from '../../hooks/useMessages';
import { useConversationMessages } from '../../hooks/useConversationMessages';
import ChatMessage from './ChatMessage';

interface ExpandedChatProps {
  chatId: string;
  messages?: Message[];
  currentUserId: string | null;
  showAttachMenu: boolean;
  isSendingMessage: boolean;
  onFileUpload: (chatId: string, file: File) => void;
  onSendQuickMessage: (chatId: string) => void;
  messageText?: string;
  setMessageText?: (text: string) => void;
  historyContainerRef?: React.RefObject<HTMLDivElement | null>;
  historyEndRef?: React.RefObject<HTMLDivElement | null>;
  onOpenChat?: (chatId: string) => void;
  showScrollButton?: boolean;
  onScroll?: () => void;
  scrollToBottom?: () => void;
  onClearChatHistory?: (chatId: string) => void;
  onMarkAsRead?: (chatId: string) => void;
}

function ExpandedChat({
  chatId,
  messages,
  currentUserId,
  showAttachMenu,
  isSendingMessage,
  onFileUpload,
  onSendQuickMessage,
  messageText,
  setMessageText,
  historyContainerRef,
  historyEndRef,
  onOpenChat,
  showScrollButton,
  onScroll,
  scrollToBottom,
  onClearChatHistory,
  onMarkAsRead,
}: ExpandedChatProps) {
  const internalHistoryRef = useRef<HTMLDivElement>(null);
  const historyRef = historyContainerRef ?? internalHistoryRef;

  // If messages not provided via props, use the conversation hook to load them
  const { messages: loadedMessages } = useConversationMessages(chatId ?? null);
  const effectiveMessages = React.useMemo(() => messages ?? loadedMessages ?? [], [messages, loadedMessages]);

  // Track which chats have been marked as read to avoid duplicate calls
  const markedAsReadRef = useRef<Set<string>>(new Set());

  // Mark conversation as read when chat becomes visible
  useEffect(() => {
    if (effectiveMessages && effectiveMessages.length > 0 && onMarkAsRead && !markedAsReadRef.current.has(chatId)) {
      console.log('👁️ Chat visible, marking as read:', chatId);
      markedAsReadRef.current.add(chatId);
      onMarkAsRead(chatId);
    }
  }, [effectiveMessages, chatId, onMarkAsRead]);

  // Track previous message count to only scroll on new messages
  const prevMessageCountRef = useRef(0);

  useEffect(() => {
    const currentCount = effectiveMessages?.length || 0;
    const prevCount = prevMessageCountRef.current;
    
    // Only scroll if we have new messages (count increased)
    if (effectiveMessages && currentCount > prevCount && currentCount > 0) {
      // Use requestAnimationFrame for better timing
      requestAnimationFrame(() => {
        historyEndRef?.current?.scrollIntoView({ behavior: 'instant' as ScrollBehavior });
      });
    }
    
    prevMessageCountRef.current = currentCount;
  }, [effectiveMessages, historyEndRef]);

  return (
    <div className="chat-expanded">
      {effectiveMessages && effectiveMessages.length > 0 && (
        <div className="chat-history-wrapper">
          <div className="chat-history" ref={historyRef} onScroll={onScroll}>
            {effectiveMessages.map(msg => (
              <ChatMessage
                key={msg.id}
                message={msg}
                currentUserId={currentUserId}
              />
            ))}
            <div ref={historyEndRef} />
          </div>
          {showScrollButton && (
            <button className="chat-scroll-to-bottom" onClick={scrollToBottom} title="Zur letzten Nachricht">
              ⬇️
            </button>
          )}
        </div>
      )}
      <div className="chat-quick-message">
  <input type="file" style={{ display: 'none' }} onChange={(e) => e.target.files?.[0] && onFileUpload(chatId, e.target.files[0])} accept="audio/*,video/*,image/*,.mid,.midi,.pdf,.doc,.docx" />
  <div className="chat-quick-attach-menu" style={{ display: showAttachMenu ? 'flex' : 'none' }}>
          <button title="Audio">🎧</button>
          <button title="MIDI">🎹</button>
          <button title="Bild">🖼️</button>
          <button title="Dokument">📄</button>
        </div>
        <button className="chat-quick-attach">📎</button>
        <input type="text" placeholder="Nachricht..." className="chat-quick-input" value={messageText || ''} onChange={(e) => setMessageText?.(e.target.value)} onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSendQuickMessage?.(chatId);
          }
        }} />
        <button className="chat-quick-send" disabled={isSendingMessage} onClick={() => onSendQuickMessage?.(chatId)}>📤</button>
        <button className="chat-quick-open" onClick={() => onOpenChat?.(chatId)}>🔗</button>
        {onClearChatHistory && (
          <button 
            className="chat-clear-history" 
            onClick={() => onClearChatHistory(chatId)} 
            title="Chatverlauf löschen"
          >
            🗑️
          </button>
        )}
      </div>
    </div>
  );
}

export default memo(ExpandedChat);
