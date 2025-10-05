// ============================================
// CHAT SIDEBAR COMPONENT
// Corporate Theme - Slide-in Chat Interface
// ============================================

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useGlobalMessagesSubscription } from '../../hooks/useGlobalMessagesSubscription';
import ChatList from './ChatList';
import ExpandedChat from './ExpandedChat';
import type { Message } from '../../hooks/useMessages';
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
  const [expandedChatId, setExpandedChatId] = useState<string | null>(null);
  const [messageText, setMessageText] = useState<string>('');
  const [isSendingMessage, setIsSendingMessage] = useState<boolean>(false);
  const [showAttachMenu, setShowAttachMenu] = useState<boolean>(false);
  const [chatMessages, setChatMessages] = useState<Record<string, Message[]>>({});
  const [showScrollButton, setShowScrollButton] = useState<Record<string, boolean>>({});

  const historyEndRef = useRef<HTMLDivElement>(null);
  const historyContainerRef = useRef<HTMLDivElement>(null);
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

  // Centralized subscription for message inserts
  useGlobalMessagesSubscription({
    channelId: `sidebar_global:${currentUserId}`,
    enabled: !!isOpen && !!currentUserId,
    onInsert: (payload) => {
      // payload is unknown; assume shape similar to previous implementation
      try {
  // @ts-expect-error supabase-payload
        const conversationId = payload.new?.conversation_id;
        console.log('New message received:', conversationId);
        refreshConversations();
  // @ts-expect-error supabase-payload
        if (payload.new?.sender_id !== currentUserId) {
          playMessageReceived();
        }
      } catch {
        // swallow any shape errors
      }
    }
  });

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
    if (expandedChatId === chatId) {
      setExpandedChatId(null);
      return;
    }
    setExpandedChatId(chatId);
    setSelectedChat(chatId);
    const chat = allChats.find(c => c.id === chatId);
    if (!chat) return;
    if (chat.unreadCount > 0) playMessageReceived();
    if (!chat.isExistingConversation && chat.friendId) {
      try {
        const conversationId = await createOrOpenDirectConversation(chat.friendId);
        if (conversationId) {
          success(`Chat mit ${chat.name} gestartet!`);
          await loadConversations();
        }
      } catch (error) {
        console.error('Error:', error);
      }
    }
    // Load messages ONLY if not already loaded
    if (chat.isExistingConversation && !chatMessages[chatId]) {
      const { data } = await supabase.from('messages').select('*').eq('conversation_id', chatId).order('created_at', { ascending: true }).limit(20);
      if (data) {
        setChatMessages(prev => ({ ...prev, [chatId]: data }));
        setShowScrollButton(prev => ({ ...prev, [chatId]: false }));
        // Instant scroll to bottom ONLY on first load
        setTimeout(() => {
          historyEndRef.current?.scrollIntoView({ behavior: 'instant' });
        }, 50);
      }
    }
  }, [expandedChatId, allChats, playMessageReceived, createOrOpenDirectConversation, success, loadConversations, chatMessages]);

  // Real-time message subscription
  useEffect(() => {
    if (!expandedChatId) return;
    const channel = supabase
      .channel(`messages:${expandedChatId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${expandedChatId}`
      }, (payload: unknown) => {
        const p = payload as { new: Message };
        setChatMessages(prev => ({
          ...prev,
          [expandedChatId]: [...(prev[expandedChatId] || []), p.new as Message]
        }));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [expandedChatId]);

  // Auto-scroll to bottom when NEW messages arrive (only if user is at bottom)
  useEffect(() => {
    if (expandedChatId && chatMessages[expandedChatId]) {
      const isAtBottom = !showScrollButton[expandedChatId];
      if (isAtBottom) {
        setTimeout(() => {
          historyEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 50);
      }
    }
  }, [chatMessages, expandedChatId, showScrollButton]);

  // Handle scroll detection
  const handleScroll = useCallback((chatId: string) => {
    const container = historyContainerRef.current;
    if (!container) return;
    const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 50;
    setShowScrollButton(prev => ({ ...prev, [chatId]: !isAtBottom }));
  }, []);

  // Scroll to bottom function
  const scrollToBottom = useCallback((chatId: string) => {
    historyEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setShowScrollButton(prev => ({ ...prev, [chatId]: false }));
  }, []);

  const handleSendQuickMessage = useCallback(async (chatId: string) => {
    if (!messageText.trim() || isSendingMessage) return;
    setIsSendingMessage(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const content = messageText.trim();
      setMessageText(''); // Sofort Input leeren für besseres UX
      await supabase.from('messages').insert({
        conversation_id: chatId,
        sender_id: user.id,
        content: content,
        message_type: 'text'
      });
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsSendingMessage(false);
    }
  }, [messageText, isSendingMessage]);

  const handleFileUpload = useCallback(async (chatId: string, file: File) => {
    setIsSendingMessage(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('message-attachments')
        .upload(`${user.id}/${fileName}`, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('message-attachments').getPublicUrl(uploadData.path);
      const messageType = file.type.startsWith('audio/') ? 'voice' : file.type.startsWith('video/') ? 'video' : file.type.startsWith('image/') ? 'image' : 'file';
      await supabase.from('messages').insert({
        conversation_id: chatId,
        sender_id: user.id,
        content: publicUrl,
        message_type: messageType,
        metadata: { fileName: file.name, fileSize: file.size, fileType: file.type }
      });
      success(`${file.name} gesendet!`);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsSendingMessage(false);
      setShowAttachMenu(false);
    }
  }, [success]);

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

        <ChatList
          loading={loading}
          chats={allChats.map(c => ({
            id: c.id,
            name: c.name,
            lastMessage: c.lastMessage,
            timestamp: c.timestamp,
            unreadCount: c.unreadCount,
            isOnline: !!c.isOnline,
            avatar: c.avatar,
            isLastMessageFromMe: !!c.isLastMessageFromMe,
            isExistingConversation: !!c.isExistingConversation,
            ...(c.friendId ? { friendId: c.friendId } : {}),
          }))}
          selectedChatId={selectedChat}
          onSelect={handleChatSelect}
          expandedChatId={expandedChatId}
        >
          {expandedChatId && expandedChatId in chatMessages && (
            <ExpandedChat
              chatId={expandedChatId}
              messages={chatMessages[expandedChatId] || []}
              currentUserId={currentUserId}
              showAttachMenu={showAttachMenu}
              isSendingMessage={isSendingMessage}
              onFileUpload={handleFileUpload}
              onSendQuickMessage={handleSendQuickMessage}
              historyContainerRef={historyContainerRef}
              historyEndRef={historyEndRef}
              onOpenChat={(id) => navigate(`/chat/${id}`)}
              showScrollButton={!!showScrollButton[expandedChatId]}
              onScroll={() => handleScroll(expandedChatId)}
              scrollToBottom={() => scrollToBottom(expandedChatId)}
            />
          )}
        </ChatList>

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

// realtime payloads are mapped to the canonical `Message` type from useMessages