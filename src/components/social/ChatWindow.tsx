import React, { useEffect, useRef, useState } from 'react';
import { useMessages } from '../../hooks/useMessages';
import { useConversations } from '../../hooks/useConversations';
import type { Conversation } from '../../hooks/useConversations';

interface ChatWindowProps {
  conversationId: string;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ conversationId }) => {
  const { 
    messages, 
    loading, 
    sendMessage,
    typingUsers,
    startTyping,
    stopTyping,
    markAsRead
  } = useMessages(conversationId);
  
  const { conversations } = useConversations();
  const [messageInput, setMessageInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setMessageInput(value);

    // Typing indicator
    if (value.trim()) {
      startTyping();
      
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Set new timeout to stop typing after 3s
      typingTimeoutRef.current = setTimeout(() => {
        stopTyping();
      }, 3000);
    } else {
      stopTyping();
    }
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || isSending) return;

    const content = messageInput.trim();
    setMessageInput('');
    setIsSending(true);

    // Stop typing indicator
    stopTyping();
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    try {
      await sendMessage(content, 'text');
      
      // Focus back to input
      inputRef.current?.focus();
      
      // Scroll to bottom
      scrollToBottom();
    } catch (error) {
      console.error('Error sending message:', error);
      // Restore message on error
      setMessageInput(content);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
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

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / 86400000);

    // Heute: Nur Uhrzeit
    if (diffDays === 0) {
      return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
    }
    
    // Gestern
    if (diffDays === 1) {
      return `Gestern ${date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    // Diese Woche: Wochentag + Uhrzeit
    if (diffDays < 7) {
      return date.toLocaleDateString('de-DE', { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    }
    
    // Älter: Datum + Uhrzeit
    return date.toLocaleDateString('de-DE', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit', 
      minute: '2-digit' 
    });
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
              <div
                key={message.id}
                className={`message-wrapper ${
                  message.sender_id === conversation?.currentUserId ? 'sent' : 'received'
                }`}
              >
                <div className="message-bubble">
                  {/* Sender Name (nur in Gruppen für received messages) */}
                  {conversation?.type === 'group' && 
                   message.sender_id !== conversation?.currentUserId && (
                    <div className="message-sender">
                      {message.sender?.full_name || message.sender?.username || 'User'}
                    </div>
                  )}
                  
                  {/* Message Content */}
                  <div className="message-content">
                    {message.content}
                  </div>
                  
                  {/* Message Footer: Time + Read Receipts */}
                  <div className="message-footer">
                    <span className="message-time">
                      {formatMessageTime(message.created_at)}
                    </span>
                    {message.sender_id === conversation?.currentUserId && (
                      <span className="message-status">
                        {message.read_receipts && message.read_receipts.length > 1 ? '✓✓' : '✓'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {/* Typing Indicator */}
            {renderTypingIndicator()}
            
            {/* Scroll Anchor */}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      <div className="chat-window__input">
        <button className="icon-button" aria-label="Emoji">😊</button>
        <button className="icon-button" aria-label="Datei anhängen">📎</button>
        
        <textarea
          ref={inputRef}
          value={messageInput}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          placeholder="Nachricht eingeben..."
          rows={1}
          disabled={isSending}
          className="message-input"
        />
        
        <button
          onClick={handleSendMessage}
          disabled={!messageInput.trim() || isSending}
          className="send-button"
          aria-label="Senden"
        >
          {isSending ? '⏳' : '📤'}
        </button>
      </div>
    </div>
  );
};
