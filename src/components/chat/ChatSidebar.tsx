// ============================================
// CHAT SIDEBAR COMPONENT
// Corporate Theme - Slide-in Chat Interface
// ============================================

import { useRef, useState, useCallback } from 'react';
import { memo } from 'react';

// Components
import ChatList from './ChatList';
import ExpandedChat from './ExpandedChat';
import SidebarHeader from './SidebarHeader';
import { ResizeHandles } from './ResizeHandles';
import { ChatFooter } from './ChatFooter';

// Hooks
import { useConversations, type Conversation } from '../../hooks/useConversations';
import { useChatSounds } from '../../lib/sounds/chatSounds';
import { useToast } from '../../hooks/useToast';
import { useSidebarState } from '../../hooks/useSidebarState';
import { useResizeHandlers } from '../../hooks/useResizeHandlers';
import { useDragHandlers } from '../../hooks/useDragHandlers';
import { useMessages } from '../../hooks/useMessages';
import { useChatSynchronizer } from '../../hooks/useChatSynchronizer';
import { useChatUIState } from '../../hooks/useChatUIState';
import { useChatCoordination } from '../../hooks/useChatCoordination';
import { useSidebarLifecycle } from '../../hooks/useSidebarLifecycle';
import { useNavigation } from '../../hooks/useNavigation';

// Utils
import { supabase } from '../../lib/supabase';
import { formatTime } from '../../lib/timeUtils';

/**
 * Props for the ChatSidebar component
 */
interface ChatSidebarProps {
  /** Whether the sidebar is currently open */
  isOpen: boolean;
  /** Callback function to close the sidebar */
  onClose: () => void;
  /** Additional CSS class names */
  className?: string;
  /** Conversations from parent (optional - will load if not provided) */
  conversations?: Conversation[];
  /** Load conversations callback from parent (optional) */
  loadConversations?: () => Promise<void>;
  /** Create conversation callback from parent (optional) */
  createOrOpenDirectConversation?: (friendId: string) => Promise<string | null>;
  /** Function to check if a user is online */
  isUserOnline?: (userId: string) => boolean;
}

/**
 * ChatSidebar component - Main chat interface with slide-in functionality
 *
 * Features:
 * - Resizable and draggable sidebar (when pinned)
 * - Chat list with unread counts
 * - Expanded chat view for active conversations
 * - Real-time message updates
 * - Sound notifications
 *
 * @param props - Component props
 * @returns JSX.Element
 */
function ChatSidebar({ 
  isOpen, 
  onClose, 
  className = '',
  conversations: conversationsProp,
  loadConversations: loadConversationsProp,
  createOrOpenDirectConversation: createOrOpenDirectConversationProp,
  isUserOnline,
}: ChatSidebarProps) {
  // Core dependencies - use props if provided, otherwise load locally
  const localConversations = useConversations();
  
  const conversations = conversationsProp || localConversations.conversations;
  const loadConversations = loadConversationsProp || localConversations.loadConversations;
  const createOrOpenDirectConversation = createOrOpenDirectConversationProp || localConversations.createOrOpenDirectConversation;
  const { playMessageReceived, playChatOpen, playChatClose } = useChatSounds();
  const { success } = useToast();
  const { navigateToChat } = useNavigation();

  // Refs
  const historyEndRef = useRef<HTMLDivElement>(null);
  const historyContainerRef = useRef<HTMLDivElement>(null);

  // Sidebar UI State (inkl. Steuerung)
  const {
    sidebarWidth,
    sidebarHeight,
    sidebarPosition,
    isResizingLeft,
    isResizingRight,
    isResizingTop,
    isResizingBottom,
    isDragging,
    dragStart,
    isGradientEnabled,
    isPinned,
    setSidebarWidth,
    setSidebarHeight,
    setSidebarPosition,
    setIsResizingLeft,
    setIsResizingRight,
    setIsResizingTop,
    setIsResizingBottom,
    setIsDragging,
    setDragStart,
    handleViewAllChats,
    handleToggleGradient,
    handleTogglePin,
    handleResetPosition,
  } = useSidebarState();

  // Lifecycle and side effects
  const { currentUserId, isMobile } = useSidebarLifecycle({
    isOpen,
    playChatOpen,
    playChatClose,
    supabase,
  });

  // Resize and drag handlers (dependent on isMobile)
  const {
    handleResizeLeftStart,
    handleResizeRightStart,
    handleResizeTopStart,
    handleResizeBottomStart,
  } = useResizeHandlers({
    isMobile,
    isPinned,
    sidebarPosition,
    isResizingLeft,
    isResizingRight,
    isResizingTop,
    isResizingBottom,
    setSidebarWidth,
    setSidebarHeight,
    setSidebarPosition,
    setIsResizingLeft,
    setIsResizingRight,
    setIsResizingTop,
    setIsResizingBottom,
  });

  const { handleDragStart } = useDragHandlers({
    isMobile,
    isPinned,
    isDragging,
    dragStart,
    setIsDragging,
    setDragStart,
    setSidebarPosition,
  });

  // Chat UI state
  const {
    selectedChat,
    setSelectedChat,
    expandedChatId,
    setExpandedChatId,
    showAttachMenu,
    setShowAttachMenu,
  } = useChatUIState();

  // Chat data and state
  const allChats = conversations.map(conv => {
    // Get other user's ID from conversation
    const otherUserId = conv.other_user?.id;
    const isOtherUserOnline = otherUserId && isUserOnline ? isUserOnline(otherUserId) : false;

    return {
      id: conv.id,
      name: conv.other_user?.full_name || conv.name || 'Unbekannt',
      lastMessage: conv.lastMessage?.content || 'Keine Nachrichten',
      timestamp: formatTime(conv.last_message_at),
      unreadCount: conv.unreadCount || 0,
      isOnline: isOtherUserOnline,
      avatar: conv.avatar_url || undefined,
      isLastMessageFromMe: !!(currentUserId && conv.lastMessage?.sender_id === currentUserId),
      isExistingConversation: true,
    };
  });

  // Messages for expanded chat
  const {
    messages: expandedMessages,
    sending: isSendingMessage,
    sendMessage: handleSendMessage,
  } = useMessages(expandedChatId);

  // Local state for message input
  const [messageText, setMessageText] = useState('');

  const handleFileUpload = useCallback(async () => {
    // TODO: Implement file upload with useMessages
    success('Datei-Upload noch nicht implementiert');
  }, [success]);

  // Chat coordination (must be before useChatSynchronizer)
  const {
    handleChatSelect,
    markConversationAsRead,
    clearChatHistory,
  } = useChatCoordination({
    allChats,
    expandedChatId,
    setExpandedChatId,
    setSelectedChat,
    playMessageReceived,
    createOrOpenDirectConversation,
    success,
    loadConversations,
    messageText,
    setMessageText,
    expandedChatHandleSend: handleSendMessage,
    setShowAttachMenu,
    expandedChatHandleUpload: handleFileUpload,
    currentUserId,
  });

  // Chat synchronization with auto-read (must be after useChatCoordination)
  useChatSynchronizer({
    currentUserId,
    isOpen,
    loadConversations,
    playMessageReceived,
    expandedChatId,
    markConversationAsRead,
  });

  // Message handlers
  const handleSendQuickMessage = useCallback(async () => {
    if (!messageText.trim()) return;
    const textToSend = messageText;
    setMessageText(''); // Clear input immediately
    await handleSendMessage(textToSend);
    // NOTE: Wir markieren NICHT als gelesen nach dem Senden, da:
    // 1. Der Chat bereits beim Öffnen als gelesen markiert wurde
    // 2. Eigene Nachrichten keine ungelesenen Badges erzeugen sollten
    // 3. Die Realtime-Subscription die UI automatisch aktualisiert
  }, [messageText, setMessageText, handleSendMessage]);

  return (
    <>
      {/* Overlay - only when not pinned */}
      {isOpen && !isPinned && (
        <div
          className="chat-sidebar-overlay"
          onClick={onClose}
          onKeyDown={(e) => e.key === 'Escape' && onClose()}
          role="button"
          tabIndex={0}
          aria-label="Chat schließen"
        />
      )}

      {/* Sidebar */}
      <div
        className={`chat-sidebar ${isOpen ? 'chat-sidebar--open' : ''} ${isPinned ? 'chat-sidebar--pinned' : ''} ${(isResizingLeft || isResizingRight || isResizingTop || isResizingBottom) ? 'chat-sidebar--resizing' : ''} ${isDragging ? 'chat-sidebar--dragging' : ''} ${isGradientEnabled ? 'chat-sidebar--gradient' : ''} ${className}`}
        style={{
          width: `${sidebarWidth}px`,
          height: `${sidebarHeight}px`,
          top: `${sidebarPosition.top}px`,
          right: `${sidebarPosition.right}px`,
          // Performance optimization: avoid layout thrashing
          transform: isDragging ? `translate(${sidebarPosition.right - (window.innerWidth - sidebarWidth)}px, ${sidebarPosition.top}px)` : undefined,
        }}
        role="complementary"
        aria-label="Chat Sidebar"
      >
        {/* Resize handles - only when pinned */}
        <ResizeHandles
          isMobile={isMobile}
          isPinned={isPinned}
          onResizeLeftStart={handleResizeLeftStart}
          onResizeRightStart={handleResizeRightStart}
          onResizeTopStart={handleResizeTopStart}
          onResizeBottomStart={handleResizeBottomStart}
        />

        {/* Header */}
        <SidebarHeader
          isGradientEnabled={isGradientEnabled}
          isPinned={isPinned}
          isMobile={isMobile}
          onToggleGradient={handleToggleGradient}
          onTogglePin={handleTogglePin}
          onResetPosition={handleResetPosition}
          onClose={onClose}
          onDragStart={handleDragStart}
        />

        {/* Main Content */}
        <div className="chat-sidebar__content" style={{ flex: 1, overflow: 'hidden' }}>
          <ChatList
            chats={allChats}
            selectedChatId={selectedChat}
            onSelect={handleChatSelect}
            expandedChatId={expandedChatId}
          >
            {expandedChatId && (
              <ExpandedChat
                chatId={expandedChatId!}
                messages={expandedMessages}
                currentUserId={currentUserId}
                showAttachMenu={showAttachMenu}
                isSendingMessage={isSendingMessage}
                onFileUpload={handleFileUpload}
                onSendQuickMessage={handleSendQuickMessage}
                messageText={messageText}
                setMessageText={setMessageText}
                historyContainerRef={historyContainerRef}
                historyEndRef={historyEndRef}
                onOpenChat={navigateToChat}
                onClearChatHistory={clearChatHistory}
                markConversationAsRead={markConversationAsRead}
                isOpen={isOpen}
              />
            )}
          </ChatList>

          {/* Footer - now inside content for absolute positioning */}
          <ChatFooter onViewAllChats={handleViewAllChats} />
        </div>
      </div>
    </>
  );
}

// realtime payloads are mapped to the canonical `Message` type from useMessages

export default memo(ChatSidebar);