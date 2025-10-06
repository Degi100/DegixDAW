import React, { memo } from 'react';
import type { Message } from '../../hooks/useMessages';

interface ChatMessageProps {
  message: Message;
  currentUserId: string | null;
}

const ChatMessage = memo(({ message, currentUserId }: ChatMessageProps) => {
  // Memoize the time formatting to avoid recalculating on every render
  const timeStr = React.useMemo(() => {
    const msgDate = new Date(message.created_at);
    return msgDate.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  }, [message.created_at]);

  const isSent = message.sender_id === currentUserId;

  // Hide sent messages that have been read by others
  const hasBeenReadByOthers = isSent && message.read_receipts && message.read_receipts.some(rr => rr.user_id !== currentUserId);
  
  if (hasBeenReadByOthers) {
    return null; // Don't render read sent messages
  }

  return (
    <div className={`chat-history-msg ${isSent ? 'sent' : 'received'}`}>
      <div className="chat-history-msg-bubble">
        <div className="chat-history-msg-content">{message.content}</div>
        <div className="chat-history-msg-meta">
          <span className="chat-history-msg-time">{timeStr}</span>
          {isSent && (
            <span className="chat-history-msg-status">
              {(message.read_receipts && message.read_receipts.length > 0) ? '✓✓' : '✓'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
});

ChatMessage.displayName = 'ChatMessage';

export default ChatMessage;