import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useConversations } from '../../hooks/useConversations';
import type { Conversation } from '../../hooks/useConversations';

interface ConversationListProps {
  activeConversationId?: string;
}

export const ConversationList: React.FC<ConversationListProps> = ({ activeConversationId }) => {
  const navigate = useNavigate();
  const { conversations, loading, error, loadConversations } = useConversations();
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filter: Search
  const filteredConversations = conversations.filter(conv => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return conv.name?.toLowerCase().includes(query) || 
           conv.members?.some(m => 
             m.username?.toLowerCase().includes(query) || 
             m.display_name?.toLowerCase().includes(query)
           );
  });

  // Sort: Pinned first, then by last message date
  const sortedConversations = [...filteredConversations].sort((a, b) => {
    // Pinned first
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    
    // Then by last_message_at
    const dateA = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
    const dateB = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
    return dateB - dateA;
  });

  const handleConversationClick = (conversationId: string) => {
    navigate(`/chat/${conversationId}`);
  };

  const formatLastMessageTime = (timestamp?: string) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'gerade eben';
    if (diffMins < 60) return `vor ${diffMins} Min`;
    if (diffHours < 24) return `vor ${diffHours} Std`;
    if (diffDays === 1) return 'gestern';
    if (diffDays < 7) return `vor ${diffDays} Tagen`;
    
    // Format: DD.MM.YYYY
    return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const getConversationName = (conv: Conversation) => {
    if (conv.type === 'group') {
      return conv.name || 'Unbenannte Gruppe';
    }
    // Direct Chat: Zeige den anderen User
    const otherMember = conv.members?.find(m => m.user_id !== conv.currentUserId);
    return otherMember?.display_name || otherMember?.username || 'Unbekannter User';
  };

  const getConversationAvatar = (conv: Conversation) => {
    if (conv.type === 'group') {
      return conv.avatar_url || '/default-group-avatar.png';
    }
    // Direct Chat: Avatar des anderen Users
    const otherMember = conv.members?.find(m => m.user_id !== conv.currentUserId);
    return otherMember?.avatar_url || '/default-avatar.png';
  };

  const getLastMessagePreview = (conv: Conversation) => {
    if (!conv.lastMessage) return 'Keine Nachrichten';
    const { content, message_type, sender_id } = conv.lastMessage;
    const isOwnMessage = sender_id === conv.currentUserId;

    // Bestimme Namen-Präfix: eigene Nachrichten -> 'Du', fremde -> Name der anderen Person
    let prefix = 'Du';
    if (!isOwnMessage) {
      const otherMember = conv.members?.find(m => m.user_id !== conv.currentUserId);
      prefix = otherMember?.display_name || otherMember?.username || 'Unbekannter User';
    }

    let preview = '';
    switch (message_type) {
      case 'text':
        preview = content || '';
        break;
      case 'image':
        preview = '📷 Bild';
        break;
      case 'video':
        preview = '🎥 Video';
        break;
      case 'voice':
        preview = '🎤 Sprachnachricht';
        break;
      case 'file':
        preview = '📎 Datei';
        break;
      default:
        preview = 'Nachricht';
    }
    return `${prefix}: ${preview}`;
  };

  const getOnlineStatus = (conv: Conversation) => {
  if (conv.type === 'group') return false;
  const otherMember = conv.members?.find(m => m.user_id !== conv.currentUserId);
  return otherMember?.is_online || false;
  };

  if (loading) {
    return (
      <div className="conversation-list">
        <div className="conversation-list__header">
          <h2>Chats</h2>
        </div>
        <div className="conversation-list__loading">
          <div className="spinner"></div>
          <p>Lade Chats...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="conversation-list">
        <div className="conversation-list__header">
          <h2>Chats</h2>
        </div>
        <div className="conversation-list__error">
          <p>❌ {error}</p>
          <button onClick={loadConversations}>Erneut versuchen</button>
        </div>
      </div>
    );
  }

  return (
    <div className="conversation-list">
      {/* Header mit Search */}
      <div className="conversation-list__header">
        <h2>Chats</h2>
        <div className="conversation-list__search">
          <input
            type="text"
            placeholder="Suche..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button 
              className="clear-search"
              onClick={() => setSearchQuery('')}
              aria-label="Suche löschen"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Conversation Items */}
      <div className="conversation-list__items">
        {sortedConversations.length === 0 ? (
          <div className="conversation-list__empty">
            {searchQuery ? (
              <>
                <p>🔍 Keine Chats gefunden</p>
                <small>Versuche einen anderen Suchbegriff</small>
              </>
            ) : (
              <>
                <p>💬 Noch keine Chats</p>
                <small>Starte einen neuen Chat mit deinen Freunden</small>
              </>
            )}
          </div>
        ) : (
          sortedConversations.map(conv => (
            <div
              key={conv.id}
              className={`conversation-item ${conv.id === activeConversationId ? 'active' : ''} ${conv.isPinned ? 'pinned' : ''}`}
              onClick={() => handleConversationClick(conv.id)}
            >
              {/* Avatar mit Online-Status */}
              <div className="conversation-item__avatar">
                <img 
                  src={getConversationAvatar(conv)} 
                  alt={getConversationName(conv)}
                />
                {getOnlineStatus(conv) && <span className="online-indicator"></span>}
              </div>

              {/* Content: Name, Last Message, Time */}
              <div className="conversation-item__content">
                <div className="conversation-item__header">
                  <h3 className="conversation-item__name">
                    {conv.isPinned && <span className="pin-icon">📌</span>}
                    {getConversationName(conv)}
                  </h3>
                  <span className="conversation-item__time">
                    {formatLastMessageTime(conv.last_message_at || undefined)}
                  </span>
                </div>
                
                <div className="conversation-item__footer">
                  <p className="conversation-item__preview">
                    {getLastMessagePreview(conv)}
                  </p>
                  
                  {/* Unread Badge */}
                  {(conv.unreadCount || 0) > 0 && (
                    <span className="conversation-item__unread">
                      {(conv.unreadCount || 0) > 99 ? '99+' : conv.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* New Chat Button */}
      <button 
        className="conversation-list__new-chat"
        onClick={() => navigate('/chat/new')}
        aria-label="Neuer Chat"
      >
        ✏️
      </button>
    </div>
  );
};
