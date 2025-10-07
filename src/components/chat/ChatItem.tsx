import { useState, useEffect, useRef } from 'react';

export interface ChatItemProps {
  id: string;
  name: string;
  lastMessage: string;
  timestamp: string;
  unreadCount?: number; // Optional - wird neu berechnet
  isOnline?: boolean;
  avatar?: string | undefined;
  isLastMessageFromMe?: boolean;
  isExistingConversation?: boolean;
  friendId?: string;
  selected?: boolean;
  onClick?: (id: string) => void;
}

export default function ChatItem({
  id,
  name,
  lastMessage,
  timestamp,
  unreadCount,
  isOnline,
  avatar,
  isLastMessageFromMe,
  isExistingConversation,
  selected,
  onClick,
}: ChatItemProps) {
  // ✨ NEUE Glow-Animation bei eingehenden Nachrichten
  const [isNewlyReceived, setIsNewlyReceived] = useState(false);
  const [isBadgeNew, setIsBadgeNew] = useState(false);
  const prevUnread = useRef(0);

  useEffect(() => {
    // Nur triggern wenn unreadCount steigt UND Chat nicht selected ist
    if (unreadCount && unreadCount > prevUnread.current && !selected) {
      // Glow-Effekt für 500ms
      setIsNewlyReceived(true);
      setTimeout(() => setIsNewlyReceived(false), 500);
      
      // Badge-Pulse für 2s
      setIsBadgeNew(true);
      setTimeout(() => setIsBadgeNew(false), 2000);
    }
    prevUnread.current = unreadCount || 0;
    
    // Animation zurücksetzen wenn gelesen
    if (!unreadCount || unreadCount === 0) {
      setIsNewlyReceived(false);
      setIsBadgeNew(false);
    }
  }, [unreadCount, selected]);
  return (
    <div className="chat-item-wrapper">
      <button
        className={`chat-item ${selected ? 'chat-item--active' : ''} ${isNewlyReceived ? 'chat-item--newly-received' : ''}`}
        onClick={() => onClick?.(id)}
      >
        <div className="chat-item-avatar">
          {avatar ? <img src={avatar} alt={name} /> : name.charAt(0).toUpperCase()}
        </div>
        <div className="chat-item-content">
          <div className="chat-item-header">
            <span className="chat-item-name">{name}</span>
          </div>
          <div className="chat-item-message">
            {isLastMessageFromMe && <span className="chat-message-prefix">Du: </span>}
            {!isExistingConversation && <span className="chat-new-conversation">💬 </span>}
            {lastMessage}
          </div>
          <span className="chat-item-time">{timestamp}</span>
        </div>
        {(() => {
          console.log('ChatItem:', id, 'unreadCount:', unreadCount, typeof unreadCount);
          return unreadCount !== undefined && unreadCount > 0 && (
            <span className={`chat-item-badge ${isBadgeNew ? 'chat-item-badge--new' : ''}`}>
              {unreadCount}
            </span>
          );
        })()}
        {isOnline && <div className="chat-item-online-indicator" />}
      </button>
    </div>
  );
}
