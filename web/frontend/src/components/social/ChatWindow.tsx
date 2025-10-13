import React, { useEffect, useRef } from 'react';
import { useMessages } from '../../hooks/useMessages';
import { useConversations } from '../../hooks/useConversations';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import type { Conversation } from '../../hooks/useConversations';

interface ChatWindowProps {
  conversationId: string;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ conversationId }) => {
  const { 
    messages, 
    loading, 
    sendMessage,
    editMessage,
    deleteMessage,
    addReaction,
    removeReaction,
    typingUsers,
    startTyping,
    stopTyping,
    markAsRead
  } = useMessages(conversationId);
  
  const { conversations } = useConversations();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Find current conversation
  const conversation = conversations.find(c => c.id === conversationId);

  // Mark as read when messages change
  useEffect(() => {
    if (messages.length > 0) {
      markAsRead(conversationId);
    }
  }, [messages.length, conversationId, markAsRead]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getConversationName = (conv?: Conversation) => {
    if (!conv) return 'Chat';
    if (conv.type === 'group') {
      return conv.name || 'Unbenannte Gruppe';
    }
    // Direct Chat: Zeige den anderen User
    const otherMember = conv.members?.find(m => m.user_id !== conv.currentUserId);
    return otherMember?.display_name || otherMember?.username || 'Unbekannter User';
  };

  const getConversationAvatar = (conv?: Conversation) => {
    if (!conv) return '/default-avatar.png';
    if (conv.type === 'group') {
      return conv.avatar_url || '/default-group-avatar.png';
    }
    // Direct Chat: Avatar des anderen Users
    const otherMember = conv.members?.find(m => m.user_id !== conv.currentUserId);
    return otherMember?.avatar_url || '/default-avatar.png';
  };

  const getOnlineStatus = (conv?: Conversation) => {
    if (!conv || conv.type === 'group') return false;
    const otherMember = conv.members?.find(m => m.user_id !== conv.currentUserId);
    return otherMember?.is_online || false;
  };

  const renderTypingIndicator = () => {
    if (typingUsers.length === 0) return null;

    const names = typingUsers.map(u => u.full_name || u.username || 'User').join(', ');
    const verb = typingUsers.length === 1 ? 'schreibt' : 'schreiben';

    return (
      <div className="typing-indicator">
        <span className="typing-indicator__text">{names} {verb}...</span>
        <span className="typing-indicator__dots">
          <span></span>
          <span></span>
          <span></span>
        </span>
      </div>
    );
  };

  if (loading && messages.length === 0) {
    return (
      <div className="chat-window">
        <div className="chat-window__header">
          <div className="chat-window__header-info">
            <div className="chat-window__avatar">
              <img src={getConversationAvatar(conversation)} alt="Avatar" />
            </div>
            <div className="chat-window__header-text">
              <h3>{getConversationName(conversation)}</h3>
            </div>
          </div>
        </div>
        <div className="chat-window__loading">
          <div className="spinner"></div>
          <p>Lade Nachrichten...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-window">
      {/* Header */}
      <div className="chat-window__header">
        <div className="chat-window__header-info">
          <div className="chat-window__avatar">
            <img src={getConversationAvatar(conversation)} alt="Avatar" />
            {getOnlineStatus(conversation) && <span className="online-indicator"></span>}
          </div>
          <div className="chat-window__header-text">
            <h3>{getConversationName(conversation)}</h3>
            {getOnlineStatus(conversation) && <span className="status">online</span>}
            {conversation?.type === 'group' && (
              <span className="members-count">
                {conversation.members?.length || 0} Mitglieder
              </span>
            )}
          </div>
        </div>
        <div className="chat-window__header-actions">
          <button className="icon-button" aria-label="Suche">🔍</button>
          <button className="icon-button" aria-label="Mehr">⋮</button>
        </div>
      </div>

      {/* Messages */}
      <div className="chat-window__messages" ref={messagesContainerRef}>
        {messages.length === 0 ? (
          <div className="chat-window__empty">
            <p>💬 Keine Nachrichten</p>
            <small>Sende die erste Nachricht!</small>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                isOwnMessage={message.sender_id === conversation?.currentUserId}
                showSender={conversation?.type === 'group'}
                onEdit={editMessage}
                onDelete={deleteMessage}
                onReact={addReaction}
                onRemoveReaction={removeReaction}
              />
            ))}
            
            {/* Typing Indicator */}
            {renderTypingIndicator()}
            
            {/* Scroll Anchor */}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      <MessageInput
        conversationId={conversationId}
        onSend={sendMessage}
        onTyping={startTyping}
        onStopTyping={stopTyping}
        disabled={loading}
      />
    </div>
  );
};
