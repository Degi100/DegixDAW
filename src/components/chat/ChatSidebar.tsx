// ============================================
// CHAT SIDEBAR COMPONENT
// Corporate Theme - Slide-in Chat Interface
// ============================================

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useConversations } from '../../hooks/useConversations';
import { useNavigate } from 'react-router-dom';
import { useFriends } from '../../hooks/useFriends';
import { useChatSounds } from '../../lib/sounds/chatSounds';
import { useToast } from '../../hooks/useToast';
import { supabase } from '../../lib/supabase';

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
  avatar?: string | undefined;
  isLastMessageFromMe?: boolean;
  isExistingConversation?: boolean;
  friendId?: string;
}

// Zeitformatierungs-Funktion
const formatTime = (timestamp: string | null): string => {
  if (!timestamp) return 'Nie';
  
  const now = new Date();
  const time = new Date(timestamp);
  const diffMs = now.getTime() - time.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffDays > 0) {
    return `${diffDays}d`;
  } else if (diffHours > 0) {
    const remainingMinutes = diffMinutes % 60;
    const remainingSeconds = diffSeconds % 60;
    if (remainingMinutes > 0) {
      return `${diffHours}h ${remainingMinutes}min`;
    } else {
      return `${diffHours}h ${remainingSeconds}sec`;
    }
  } else if (diffMinutes > 0) {
    const remainingSeconds = diffSeconds % 60;
    return `${diffMinutes}min ${remainingSeconds}sec`;
  } else {
    return `${diffSeconds}sec`;
  }
};

export default function ChatSidebar({ isOpen, onClose, className = '' }: ChatSidebarProps) {
  const { conversations, loading, loadConversations, createOrOpenDirectConversation } = useConversations();
  const { friends } = useFriends();
  const { playMessageReceived, playChatOpen, playChatClose } = useChatSounds();
  const { success } = useToast();
  const navigate = useNavigate();
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [refreshTimeout, setRefreshTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isPinned, setIsPinned] = useState<boolean>(false);
  const [isBlurEnabled, setIsBlurEnabled] = useState<boolean>(false);

  // Get current user ID
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setCurrentUserId(data.user?.id || null);
    };
    getUser();
  }, []);

  // Debounced refresh function to prevent too many updates
  const refreshConversations = useCallback(async () => {
    // Clear existing timeout
    if (refreshTimeout) {
      clearTimeout(refreshTimeout);
    }

    // Set new timeout for debounced refresh
    const timeout = setTimeout(async () => {
      try {
        console.log('🔄 Refreshing conversations...');
        await loadConversations();
      } catch (error) {
        console.error('Error refreshing conversations:', error);
      }
    }, 300); // 300ms debounce

    setRefreshTimeout(timeout);
  }, [loadConversations, refreshTimeout]);

  // Real-time subscriptions for live updates
  useEffect(() => {
    if (!isOpen || !currentUserId) return;

    console.log('🔔 Setting up real-time subscriptions for ChatSidebar');

    // Subscribe to conversation changes
    const conversationsChannel = supabase
      .channel('chat_sidebar_conversations')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
        },
        (payload) => {
          console.log('📢 Conversation changed:', payload);
          refreshConversations();
        }
      )
      .subscribe();

    // Subscribe to message changes - only for conversations user is part of
    const messagesChannel = supabase
      .channel('chat_sidebar_messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        async (payload) => {
          console.log('💬 New message:', payload);
          
          // Check if this message is for a conversation the user is part of
          const { data: membership } = await supabase
            .from('conversation_members')
            .select('conversation_id')
            .eq('user_id', currentUserId)
            .eq('conversation_id', payload.new.conversation_id)
            .single();

          if (membership) {
            console.log('✅ Message is for user, updating sidebar');
            refreshConversations();
            // Play sound for new messages (only if not from current user)
            if (payload.new.sender_id !== currentUserId) {
              playMessageReceived();
            }
          }
        }
      )
      .subscribe();

    // Subscribe to conversation members changes
    const membersChannel = supabase
      .channel('chat_sidebar_members')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversation_members',
          filter: `user_id=eq.${currentUserId}`,
        },
        (payload) => {
          console.log('👥 Membership changed:', payload);
          refreshConversations();
        }
      )
      .subscribe();

    return () => {
      console.log('🔕 Cleaning up real-time subscriptions');
      supabase.removeChannel(conversationsChannel);
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(membersChannel);
      
      // Clear any pending refresh timeout
      if (refreshTimeout) {
        clearTimeout(refreshTimeout);
      }
    };
  }, [isOpen, currentUserId, refreshConversations, playMessageReceived, refreshTimeout]);

  // Play sounds on open/close
  useEffect(() => {
    if (isOpen) {
      playChatOpen();
    } else {
      playChatClose();
    }
  }, [isOpen, playChatOpen, playChatClose]);

  // Echte Conversations + Freunde ohne Conversations + Demo-Chats
  const allChats = useMemo(() => {
    // Echte Conversations aus der Datenbank
    const realChats: ChatItem[] = conversations.map(conv => {
      const lastMessage = conv.lastMessage || conv.last_message;
      const isLastMessageFromMe = currentUserId && lastMessage?.sender_id === currentUserId;
      
      return {
        id: conv.id,
        name: conv.other_user?.full_name || conv.name || 'Unbekannt',
        lastMessage: lastMessage?.content || 'Keine Nachrichten',
        timestamp: formatTime(conv.last_message_at),
        unreadCount: conv.unreadCount || conv.unread_count || 0,
        isOnline: false, // TODO: Online-Status aus User-Daten laden
        avatar: conv.avatar_url || undefined,
        isLastMessageFromMe: isLastMessageFromMe || false,
        isExistingConversation: true,
      };
    });

    // Freunde ohne Conversations (für neue Chats)
    const friendsWithoutChats: ChatItem[] = friends
      .filter(friendship => {
        // Prüfe ob bereits eine Conversation mit diesem Freund existiert
        const hasConversation = conversations.some(conv => 
          conv.other_user?.id === friendship.friend_id || 
          conv.members?.some(member => member.user_id === friendship.friend_id)
        );
        return !hasConversation && friendship.status === 'accepted';
      })
      .map(friendship => ({
        id: `friend-${friendship.friend_id}`,
        name: friendship.friend_profile?.full_name || friendship.friend_profile?.username || 'Unbekannt',
        lastMessage: 'Chat starten...',
        timestamp: 'Nie',
        unreadCount: 0,
        isOnline: false, // TODO: Online-Status aus User-Daten laden
        avatar: undefined, // TODO: Avatar aus friend_profile laden
        isLastMessageFromMe: false,
        isExistingConversation: false,
        friendId: friendship.friend_id,
      }));

    // Kombiniere: Echte Conversations + Freunde ohne Chats
    return [...realChats, ...friendsWithoutChats];
  }, [conversations, friends, currentUserId]);

  const handleChatSelect = useCallback(async (chatId: string) => {
    setSelectedChat(chatId);
    const chat = allChats.find(c => c.id === chatId);
    if (!chat) return;

    // Play message received sound when selecting a chat with unread messages
    if (chat.unreadCount > 0) {
      playMessageReceived();
    }

    // If existing conversation, navigate to full chat view
    if (chat.isExistingConversation) {
      navigate(`/chat/${chat.id}`);
      return;
    }

    // Otherwise create conversation (friend without chat) and navigate
    if (chat.friendId) {
      try {
        console.log('🚀 Creating new conversation with friend:', chat.friendId);
        const conversationId = await createOrOpenDirectConversation(chat.friendId);
        if (conversationId) {
          success(`Chat mit ${chat.name} gestartet! 💬`);
          await loadConversations();
          navigate(`/chat/${conversationId}`);
        }
      } catch (error) {
        console.error('Error creating conversation:', error);
        success('Fehler beim Erstellen des Chats');
      }
    }
  }, [allChats, playMessageReceived, createOrOpenDirectConversation, success, loadConversations, navigate]);

  // Aktueller Chat: sidebar zeigt nur die Chat-Liste; volle Chat-Ansicht öffnet beim Klick

  // Inline message UI removed from sidebar. Navigation opens full chat view.

  const handleViewAllChats = useCallback(() => {
    // Navigate to full chat page
    window.location.href = '/chat';
  }, []);

  const totalUnreadCount = allChats.reduce((sum, chat) => sum + chat.unreadCount, 0);

  const handleTogglePin = useCallback(() => {
    setIsPinned(prev => !prev);
  }, []);

  const handleToggleBlur = useCallback(() => {
    setIsBlurEnabled(prev => !prev);
  }, []);

  return (
    <>
      {/* Overlay - only show when not pinned */}
      {isOpen && !isPinned && (
        <div 
          className={`chat-sidebar-overlay ${isBlurEnabled ? 'blur-enabled' : ''}`}
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <div className={`chat-sidebar ${isOpen ? 'chat-sidebar--open' : ''} ${isPinned ? 'chat-sidebar--pinned' : ''} ${className}`}>
        {/* Header */}
        <div className="chat-sidebar-header">
          <div className="chat-sidebar-title">
            <span className="chat-icon">💬</span>
            <h3>Chats</h3>
            {totalUnreadCount > 0 && (
              <span className="chat-badge">{totalUnreadCount}</span>
            )}
          </div>
          <div className="chat-sidebar-actions">
            <button
              onClick={handleToggleBlur}
              className={`chat-blur-btn ${isBlurEnabled ? 'active' : ''}`}
              aria-label="Blur-Effekt umschalten"
              title={isBlurEnabled ? 'Blur deaktivieren' : 'Blur aktivieren'}
            >
              {isBlurEnabled ? '🌫️' : '🔆'}
            </button>
            <button
              onClick={handleTogglePin}
              className={`chat-pin-btn ${isPinned ? 'pinned' : ''}`}
              aria-label="Sidebar fixieren"
              title={isPinned ? 'Sidebar lösen' : 'Sidebar fixieren'}
            >
              {isPinned ? '📌' : '📍'}
            </button>
            <button
              onClick={onClose}
              className="chat-close-btn"
              aria-label="Chat schließen"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Chat List */}
        <div className="chat-list">
          {loading ? (
            <div className="chat-empty">
              <span>⏳</span>
              <p>Lade Chats...</p>
            </div>
          ) : allChats.length === 0 ? (
            <div className="chat-empty">
              <span>💬</span>
              <p>Noch keine Chats</p>
              <p>Starte eine Unterhaltung!</p>
            </div>
          ) : (
            allChats.map((chat) => (
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
                  </div>
                  <div className="chat-item-message">
                    {chat.isLastMessageFromMe && (
                      <span className="chat-message-prefix">Du: </span>
                    )}
                    {!chat.isExistingConversation && (
                      <span className="chat-new-conversation">💬 </span>
                    )}
                    {chat.lastMessage}
                  </div>
                  <span className="chat-item-time">{chat.timestamp}</span>
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

        {/* Inline-Nachrichten-Panel entfernt; Chats öffnen die vollständige Chat-Ansicht */}

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