import React, { useRef, useEffect } from 'react';
import type { Message } from '../../hooks/useMessages';
import { useConversationMessages } from '../../hooks/useConversationMessages';

interface ExpandedChatProps {
  chatId: string;
  messages?: Message[];
  currentUserId: string | null;
  showAttachMenu: boolean;
  isSendingMessage: boolean;
  onFileUpload: (chatId: string, file: File) => void;
  onSendQuickMessage: (chatId: string) => void;
  historyContainerRef?: React.RefObject<HTMLDivElement | null>;
  historyEndRef?: React.RefObject<HTMLDivElement | null>;
  onOpenChat?: (chatId: string) => void;
  showScrollButton?: boolean;
  onScroll?: () => void;
  scrollToBottom?: () => void;
}

export default function ExpandedChat({
  chatId,
  messages,
  currentUserId,
  showAttachMenu,
  isSendingMessage,
  onFileUpload,
  onSendQuickMessage,
  historyContainerRef,
  historyEndRef,
  onOpenChat,
  showScrollButton,
  onScroll,
  scrollToBottom,
}: ExpandedChatProps) {
  const internalHistoryRef = useRef<HTMLDivElement>(null);
  const historyRef = historyContainerRef ?? internalHistoryRef;

  // If messages not provided via props, use the conversation hook to load them
  const { messages: loadedMessages } = useConversationMessages(chatId ?? null);
  const effectiveMessages = React.useMemo(() => messages ?? loadedMessages ?? [], [messages, loadedMessages]);

  useEffect(() => {
    // Scroll to bottom on mount if messages exist
    if (effectiveMessages && effectiveMessages.length > 0) {
      setTimeout(() => {
        historyEndRef?.current?.scrollIntoView({ behavior: 'instant' as ScrollBehavior });
      }, 50);
    }
  }, [effectiveMessages, historyEndRef]);

  return (
    <div className="chat-expanded">
      {effectiveMessages && effectiveMessages.length > 0 && (
        <div className="chat-history-wrapper">
          <div className="chat-history" ref={historyRef} onScroll={onScroll}>
            {effectiveMessages.map(msg => {
              const msgDate = new Date(msg.created_at);
              const timeStr = msgDate.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
              return (
                <div key={msg.id} className={`chat-history-msg ${msg.sender_id === currentUserId ? 'sent' : 'received'}`}>
                  <div className="chat-history-msg-bubble">
                        <div className="chat-history-msg-content">{msg.content}</div>
                        <div className="chat-history-msg-meta">
                          <span className="chat-history-msg-time">{timeStr}</span>
                          {msg.sender_id === currentUserId && (
                            <span className="chat-history-msg-status">{(msg.read_receipts && msg.read_receipts.length > 0) ? '✓✓' : '✓'}</span>
                          )}
                        </div>
                      </div>
                </div>
              );
            })}
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
        <input type="text" placeholder="Nachricht..." className="chat-quick-input" />
        <button className="chat-quick-send" disabled={isSendingMessage} onClick={() => onSendQuickMessage?.(chatId)}>📤</button>
        <button className="chat-quick-open" onClick={() => onOpenChat?.(chatId)}>🔗</button>
      </div>
    </div>
  );
}
