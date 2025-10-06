import React, { useRef, useEffect, memo, useState, useCallback } from 'react';
import type { Message } from '../../hooks/useMessages';
import { useConversationMessages } from '../../hooks/useConversationMessages';
import { useMessageVisibility } from '../../hooks/useMessageVisibility';
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
  onClearChatHistory?: (chatId: string) => void;
  markConversationAsRead?: (chatId: string) => Promise<void>; // Für scroll-basiertes Markieren
  isOpen?: boolean; // Ob die Sidebar/Chat geöffnet ist
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
  onClearChatHistory,
  markConversationAsRead,
  isOpen = true,
}: ExpandedChatProps) {
  const internalHistoryRef = useRef<HTMLDivElement>(null);
  const historyRef = historyContainerRef ?? internalHistoryRef;

  // Scroll-basiertes Markieren als gelesen
  const { setLastMessageRef } = useMessageVisibility({
    chatId,
    markConversationAsRead: markConversationAsRead || (async () => {}),
    isOpen,
    containerRef: historyRef,
  });

  // If messages not provided via props, use the conversation hook to load them
  const { messages: loadedMessages } = useConversationMessages(chatId ?? null);
  const effectiveMessages = React.useMemo(() => messages ?? loadedMessages ?? [], [messages, loadedMessages]);

  // Mark as read is now handled in handleChatSelect - no need for duplicate call here

  // Track previous message count to only scroll on new messages
  const prevMessageCountRef = useRef(0);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isNearBottom, setIsNearBottom] = useState(true);

  // Scroll to bottom function
  const scrollToBottom = useCallback(() => {
    historyEndRef?.current?.scrollIntoView({ behavior: 'smooth' as ScrollBehavior });
    setShowScrollButton(false);
  }, [historyEndRef]);

  // Handle scroll event to show/hide scroll button
  const handleScroll = useCallback(() => {
    const container = historyRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    
    // Show button if user scrolled up more than 200px from bottom
    const shouldShow = distanceFromBottom > 200;
    setShowScrollButton(shouldShow);
    setIsNearBottom(distanceFromBottom < 50);
  }, [historyRef]);

  useEffect(() => {
    const currentCount = effectiveMessages?.length || 0;
    const prevCount = prevMessageCountRef.current;
    
    // Only scroll if we have new messages (count increased) AND user is near bottom
    if (effectiveMessages && currentCount > prevCount && currentCount > 0 && isNearBottom) {
      // Use requestAnimationFrame for better timing
      requestAnimationFrame(() => {
        historyEndRef?.current?.scrollIntoView({ behavior: 'instant' as ScrollBehavior });
      });
    }
    
    prevMessageCountRef.current = currentCount;
  }, [effectiveMessages, historyEndRef, isNearBottom]);

  return (
    <div className="chat-expanded">
      {effectiveMessages && effectiveMessages.length > 0 && (
        <div className="chat-history-wrapper">
          <div className="chat-history" ref={historyRef} onScroll={handleScroll}>
            {effectiveMessages.map((msg, index) => {
              const isLastMessage = index === effectiveMessages.length - 1;
              return (
                <ChatMessage
                  key={msg.id}
                  message={msg}
                  currentUserId={currentUserId}
                  ref={isLastMessage ? setLastMessageRef : undefined}
                />
              );
            })}
            <div ref={historyEndRef} />
          </div>
          {showScrollButton && (
            <button 
              className="chat-scroll-to-bottom" 
              onClick={scrollToBottom} 
              title="Zur letzten Nachricht"
              aria-label="Zur letzten Nachricht scrollen"
            >
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
