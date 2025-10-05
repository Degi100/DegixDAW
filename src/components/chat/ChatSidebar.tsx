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
  const [isGradientEnabled, setIsGradientEnabled] = useState<boolean>(true);
  const [isPinned, setIsPinned] = useState<boolean>(false);
  const [sidebarWidth, setSidebarWidth] = useState<number>(420);
  const [sidebarHeight, setSidebarHeight] = useState<number>(window.innerHeight - 70);
  const [sidebarPosition, setSidebarPosition] = useState<{ top: number; right: number }>({ top: 70, right: 0 });
  const [isResizingLeft, setIsResizingLeft] = useState<boolean>(false);
  const [isResizingRight, setIsResizingRight] = useState<boolean>(false);
  const [isResizingTop, setIsResizingTop] = useState<boolean>(false);
  const [isResizingBottom, setIsResizingBottom] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth <= 768);

  // Get current user ID
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setCurrentUserId(data.user?.id || null);
    };
    getUser();
  }, []);

  // Handle window resize for mobile detection
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
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

  const handleToggleGradient = useCallback(() => {
    setIsGradientEnabled(prev => !prev);
  }, []);

  const handleTogglePin = useCallback(() => {
    setIsPinned(prev => !prev);
  }, []);

  const handleResetPosition = useCallback(() => {
    setSidebarWidth(420);
    setSidebarHeight(window.innerHeight - 70);
    setSidebarPosition({ top: 70, right: 0 });
  }, []);

  // Resize handlers
  const handleResizeLeftStart = useCallback((e: React.MouseEvent) => {
    if (isMobile || !isPinned) return;
    e.preventDefault();
    e.stopPropagation();
    setIsResizingLeft(true);
  }, [isMobile, isPinned]);

  const handleResizeRightStart = useCallback((e: React.MouseEvent) => {
    if (isMobile || !isPinned) return;
    e.preventDefault();
    e.stopPropagation();
    setIsResizingRight(true);
  }, [isMobile, isPinned]);

  const handleResizeTopStart = useCallback((e: React.MouseEvent) => {
    if (isMobile || !isPinned) return;
    e.preventDefault();
    e.stopPropagation();
    setIsResizingTop(true);
  }, [isMobile, isPinned]);

  const handleResizeBottomStart = useCallback((e: React.MouseEvent) => {
    if (isMobile || !isPinned) return;
    e.preventDefault();
    e.stopPropagation();
    setIsResizingBottom(true);
  }, [isMobile, isPinned]);

  // Resize effects
  useEffect(() => {
    if (!isResizingLeft) return;
    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = window.innerWidth - e.clientX - sidebarPosition.right;
      setSidebarWidth(Math.max(280, Math.min(window.innerWidth - 100, newWidth)));
    };
    const handleMouseUp = () => setIsResizingLeft(false);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingLeft, sidebarPosition.right]);

  useEffect(() => {
    if (!isResizingRight) return;
    const handleMouseMove = (e: MouseEvent) => {
      const newRight = window.innerWidth - e.clientX;
      setSidebarPosition(prev => ({ ...prev, right: Math.max(0, newRight) }));
    };
    const handleMouseUp = () => setIsResizingRight(false);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingRight]);

  useEffect(() => {
    if (!isResizingTop) return;
    const handleMouseMove = (e: MouseEvent) => {
      const newTop = e.clientY;
      const newHeight = window.innerHeight - newTop;
      setSidebarPosition(prev => ({ ...prev, top: Math.max(70, newTop) }));
      setSidebarHeight(Math.max(200, newHeight));
    };
    const handleMouseUp = () => setIsResizingTop(false);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingTop]);

  useEffect(() => {
    if (!isResizingBottom) return;
    const handleMouseMove = (e: MouseEvent) => {
      const newHeight = window.innerHeight - e.clientY;
      setSidebarHeight(Math.max(200, newHeight));
    };
    const handleMouseUp = () => setIsResizingBottom(false);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingBottom]);

  // Drag handler
  const handleDragStart = useCallback((e: React.MouseEvent) => {
    if (isMobile || !isPinned) return;
    if ((e.target as HTMLElement).closest('button')) return;
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  }, [isMobile, isPinned]);

  useEffect(() => {
    if (!isDragging || !dragStart) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = dragStart.x - e.clientX;
      const deltaY = e.clientY - dragStart.y;
      
      setSidebarPosition(prev => ({
        top: Math.max(0, prev.top + deltaY),
        right: Math.max(0, prev.right + deltaX)
      }));
      
      setDragStart({ x: e.clientX, y: e.clientY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setDragStart(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart]);

  return (
    <>
      {/* Overlay - only when not pinned */}
      {isOpen && !isPinned && (
        <div 
          className="chat-sidebar-overlay"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <div 
        className={`chat-sidebar ${isOpen ? 'chat-sidebar--open' : ''} ${isPinned ? 'chat-sidebar--pinned' : ''} ${(isResizingLeft || isResizingRight || isResizingTop || isResizingBottom) ? 'chat-sidebar--resizing' : ''} ${isDragging ? 'chat-sidebar--dragging' : ''} ${isGradientEnabled ? 'chat-sidebar--gradient' : ''} ${className}`}
        style={{
          width: `${sidebarWidth}px`,
          height: `${sidebarHeight}px`,
          top: `${sidebarPosition.top}px`,
          right: `${sidebarPosition.right}px`
        }}
      >
        {/* Resize handles - only when pinned */}
        {!isMobile && isPinned && (
          <>
            <div className="chat-sidebar-resize-handle chat-sidebar-resize-handle--left" onMouseDown={handleResizeLeftStart} />
            <div className="chat-sidebar-resize-handle chat-sidebar-resize-handle--right" onMouseDown={handleResizeRightStart} />
            <div className="chat-sidebar-resize-handle chat-sidebar-resize-handle--top" onMouseDown={handleResizeTopStart} />
            <div className="chat-sidebar-resize-handle chat-sidebar-resize-handle--bottom" onMouseDown={handleResizeBottomStart} />
          </>
        )}

        {/* Header */}
        <div 
          className="chat-sidebar-header"
          onMouseDown={handleDragStart}
          style={{ cursor: (isMobile || !isPinned) ? 'default' : 'move' }}
        >
          <div className="chat-sidebar-title">
            <span className="chat-icon">💬</span>
            <h3>Chats</h3>
            {totalUnreadCount > 0 && (
              <span className="chat-badge">{totalUnreadCount}</span>
            )}
          </div>
          <div className="chat-sidebar-actions">
            <button onClick={handleToggleGradient} className={`chat-gradient-btn ${isGradientEnabled ? 'active' : ''}`} title={isGradientEnabled ? 'Gradient deaktivieren' : 'Gradient aktivieren'}>
              {isGradientEnabled ? '✨' : '⭐'}
            </button>
            <button onClick={handleTogglePin} className={`chat-pin-btn ${isPinned ? 'pinned' : ''}`} title={isPinned ? 'Sidebar lösen' : 'Sidebar fixieren'}>
              {isPinned ? '📌' : '📍'}
            </button>
            <button onClick={handleResetPosition} className="chat-reset-btn" title="Zurück zum Ursprung">🔄</button>
            <button onClick={onClose} className="chat-close-btn" title="Chat schließen">✕</button>
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