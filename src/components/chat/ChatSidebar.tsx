// src/components/chat/ChatSidebar.tsx
// Chat sidebar with slide-in animation

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { chatSounds } from '../../utils/chatSounds';

interface ChatSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ChatPreview {
  id: string;
  userId: string;
  username: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
}

export default function ChatSidebar({ isOpen, onClose }: ChatSidebarProps) {
  const navigate = useNavigate();
  const [chats, setChats] = useState<ChatPreview[]>([
    // Mock data for now
    {
      id: '1',
      userId: 'user1',
      username: 'Anna Schmidt',
      lastMessage: 'Hey! Wie gehts?',
      timestamp: '2 min',
      unread: 2
    },
    {
      id: '2',
      userId: 'user2',
      username: 'Max Müller',
      lastMessage: 'Hast du Zeit später?',
      timestamp: '15 min',
      unread: 0
    },
    {
      id: '3',
      userId: 'user3',
      username: 'Lisa Weber',
      lastMessage: 'Danke für die Hilfe! 🙏',
      timestamp: '1h',
      unread: 1
    }
  ]);

  const [message, setMessage] = useState('');
  const [activeChat, setActiveChat] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      chatSounds.playNewChat();
    }
  }, [isOpen]);

  const handleChatClick = (chat: ChatPreview) => {
    setActiveChat(chat.id);
    // Navigate to full chat page
    navigate(`/chat?user=${chat.userId}`);
    onClose();
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    chatSounds.playMessageSent();
    setMessage('');
    // TODO: Send message via API
  };

  const totalUnread = chats.reduce((sum, chat) => sum + chat.unread, 0);

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="chat-sidebar-overlay"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`chat-sidebar ${isOpen ? 'chat-sidebar--open' : ''}`}>
        {/* Header */}
        <div className="chat-sidebar-header">
          <div className="chat-sidebar-title">
            <span className="chat-icon">💬</span>
            <h3>Chats</h3>
            {totalUnread > 0 && (
              <span className="chat-badge">{totalUnread}</span>
            )}
          </div>
          <button 
            className="chat-close-btn"
            onClick={onClose}
            title="Schließen"
          >
            ✕
          </button>
        </div>

        {/* Chat List */}
        <div className="chat-list">
          {chats.length === 0 ? (
            <div className="chat-empty">
              <p>Noch keine Chats</p>
              <span>💬</span>
            </div>
          ) : (
            chats.map(chat => (
              <button
                key={chat.id}
                className={`chat-item ${activeChat === chat.id ? 'chat-item--active' : ''}`}
                onClick={() => handleChatClick(chat)}
              >
                <div className="chat-item-avatar">
                  {chat.username.charAt(0).toUpperCase()}
                </div>
                <div className="chat-item-content">
                  <div className="chat-item-header">
                    <span className="chat-item-name">{chat.username}</span>
                    <span className="chat-item-time">{chat.timestamp}</span>
                  </div>
                  <div className="chat-item-message">
                    {chat.lastMessage}
                  </div>
                </div>
                {chat.unread > 0 && (
                  <span className="chat-item-badge">{chat.unread}</span>
                )}
              </button>
            ))
          )}
        </div>

        {/* Quick Reply (Optional) */}
        {activeChat && (
          <div className="chat-quick-reply">
            <form onSubmit={handleSendMessage}>
              <input
                type="text"
                placeholder="Schnelle Antwort..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="chat-input"
              />
              <button type="submit" className="chat-send-btn">
                ➤
              </button>
            </form>
          </div>
        )}

        {/* View All Button */}
        <div className="chat-sidebar-footer">
          <button 
            className="chat-view-all-btn"
            onClick={() => {
              navigate('/chat');
              onClose();
            }}
          >
            Alle Chats anzeigen →
          </button>
        </div>
      </div>
    </>
  );
}
