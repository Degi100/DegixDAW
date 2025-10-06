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
  return (
    <div className="chat-item-wrapper">
      <button
        className={`chat-item ${selected ? 'chat-item--active' : ''}`}
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
            <span className="chat-item-badge">{unreadCount}</span>
          );
        })()}
        {isOnline && <div className="chat-item-online-indicator" />}
      </button>
    </div>
  );
}
