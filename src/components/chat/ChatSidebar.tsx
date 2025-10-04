// ============================================
// CHAT SIDEBAR COMPONENT
// Corporate Theme - Slide-in Chat Interface
// ============================================

import { useState, useEffect, useCallback } from 'react';
import { useConversations } from '../../hooks/useConversations';
import { useChatSounds } from '../../lib/sounds/chatSounds';
import { useToast } from '../../hooks/useToast';

interface ChatSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

interface ChatItem {
  id: string;
  name: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  isOnline: boolean;
  avatar?: string;
}

export default function ChatSidebar({ isOpen, onClose, className = '' }: ChatSidebarProps) {
  const { loading } = useConversations();
  const { playMessageReceived, playChatOpen, playChatClose } = useChatSounds();
  const { success } = useToast();
  const [quickMessage, setQuickMessage] = useState('');
  const [selectedChat, setSelectedChat] = useState<string | null>(null);

  // Play sounds on open/close
  useEffect(() => {
    if (isOpen) {
      playChatOpen();
    } else {
      playChatClose();
    }
  }, [isOpen, playChatOpen, playChatClose]);

  // Mock data for demonstration
  const mockChats: ChatItem[] = [
    {
      id: '1',
      name: 'Anna Schmidt',
      lastMessage: 'Hey! Wie läuft das Projekt?',
      timestamp: '2 Min',
      unreadCount: 2,
      isOnline: true,
    },
    {
      id: '2',
      name: 'Max Mustermann',
      lastMessage: 'Können wir morgen das Meeting verschieben?',
      timestamp: '15 Min',
      unreadCount: 0,
      isOnline: false,
    },
    {
      id: '3',
      name: 'Sarah Weber',
      lastMessage: 'Die neuen Features sind super! 🚀',
      timestamp: '1 Std',
      unreadCount: 1,
      isOnline: true,
    },
    {
      id: '4',
      name: 'Team Chat',
      lastMessage: 'Tom: Alles bereit für den Release',
      timestamp: '2 Std',
      unreadCount: 5,
      isOnline: false,
    },
  ];

  const handleChatSelect = useCallback((chatId: string) => {
    setSelectedChat(chatId);
    // Play message received sound when selecting a chat with unread messages
    const chat = mockChats.find(c => c.id === chatId);
    if (chat && chat.unreadCount > 0) {
      playMessageReceived();
    }
  }, [playMessageReceived]);

  const handleQuickSend = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!quickMessage.trim() || !selectedChat) return;

    // Simulate sending message
    success('Nachricht gesendet! 💬');
    setQuickMessage('');
    
    // Play sent sound
    playMessageReceived();
  }, [quickMessage, selectedChat, success, playMessageReceived]);

  const handleViewAllChats = useCallback(() => {
    // Navigate to full chat page
    window.location.href = '/chat';
  }, []);

  const totalUnreadCount = mockChats.reduce((sum, chat) => sum + chat.unreadCount, 0);

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="chat-sidebar-overlay"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <div className={`chat-sidebar ${isOpen ? 'chat-sidebar--open' : ''} ${className}`}>
        {/* Header */}
        <div className="chat-sidebar-header">
          <div className="chat-sidebar-title">
            <span className="chat-icon">💬</span>
            <h3>Chats</h3>
            {totalUnreadCount > 0 && (
              <span className="chat-badge">{totalUnreadCount}</span>
            )}
          </div>
          <button
            onClick={onClose}
            className="chat-close-btn"
            aria-label="Chat schließen"
          >
            ✕
          </button>
        </div>

        {/* Chat List */}
        <div className="chat-list">
          {loading ? (
            <div className="chat-empty">
              <span>⏳</span>
              <p>Lade Chats...</p>
            </div>
          ) : mockChats.length === 0 ? (
            <div className="chat-empty">
              <span>💬</span>
              <p>Noch keine Chats</p>
              <p>Starte eine Unterhaltung!</p>
            </div>
          ) : (
            mockChats.map((chat) => (
              <button
                key={chat.id}
                className={`chat-item ${selectedChat === chat.id ? 'chat-item--active' : ''}`}
                onClick={() => handleChatSelect(chat.id)}
              >
                <div className="chat-item-avatar">
                  {chat.avatar ? (
                    <img src={chat.avatar} alt={chat.name} />
                  ) : (
                    chat.name.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="chat-item-content">
                  <div className="chat-item-header">
                    <span className="chat-item-name">{chat.name}</span>
                    <span className="chat-item-time">{chat.timestamp}</span>
                  </div>
                  <div className="chat-item-message">{chat.lastMessage}</div>
                </div>
                {chat.unreadCount > 0 && (
                  <span className="chat-item-badge">{chat.unreadCount}</span>
                )}
                {chat.isOnline && (
                  <div className="chat-item-online-indicator" />
                )}
              </button>
            ))
          )}
        </div>

        {/* Quick Reply */}
        {selectedChat && (
          <div className="chat-quick-reply">
            <form onSubmit={handleQuickSend}>
              <input
                type="text"
                value={quickMessage}
                onChange={(e) => setQuickMessage(e.target.value)}
                placeholder="Schnelle Antwort..."
                className="chat-input"
                autoFocus
              />
              <button
                type="submit"
                className="chat-send-btn"
                disabled={!quickMessage.trim()}
                aria-label="Nachricht senden"
              >
                ➤
              </button>
            </form>
          </div>
        )}

        {/* Footer */}
        <div className="chat-sidebar-footer">
          <button
            onClick={handleViewAllChats}
            className="chat-view-all-btn"
          >
            Alle Chats anzeigen
          </button>
        </div>
      </div>
    </>
  );
}