import { render, screen, fireEvent } from '@testing-library/react';
import ChatSidebar from './ChatSidebar';
import { MemoryRouter } from 'react-router-dom';

// Mock hooks
const loadConversationsMock = jest.fn();
const createOrOpenDirectConversationMock = jest.fn().mockResolvedValue('c1');
const playMessageReceivedMock = jest.fn();
const playChatOpenMock = jest.fn();
const playChatCloseMock = jest.fn();
const successMock = jest.fn();
const navigateToChatMock = jest.fn();

// Mock old hooks (still used)
jest.mock('../../hooks/useConversations', () => ({
  useConversations: () => ({
    conversations: [
      { id: 'c1', type: 'direct', name: null, description: null, avatar_url: null, created_by: 'u1', created_at: '', updated_at: '', last_message_at: new Date().toISOString(), is_archived: false, unreadCount: 1, other_user: { id: 'u2', full_name: 'Bob', username: 'bob' } }
    ],
    loading: false,
    loadConversations: loadConversationsMock,
    createOrOpenDirectConversation: createOrOpenDirectConversationMock
  })
}));

jest.mock('../../hooks/useFriends', () => ({
  useFriends: () => ({
    friends: [
      { id: 'f1', user_id: 'u1', friend_id: 'u3', status: 'accepted', requested_at: '', created_at: '', updated_at: '', friend_profile: { full_name: 'Alice', username: 'alice' } }
    ]
  })
}));

jest.mock('../../lib/sounds/chatSounds', () => ({ useChatSounds: () => ({ playMessageReceived: playMessageReceivedMock, playChatOpen: playChatOpenMock, playChatClose: playChatCloseMock }) }));
jest.mock('../../hooks/useToast', () => ({ useToast: () => ({ success: successMock, error: jest.fn() }) }));

// Mock new hooks
jest.mock('../../hooks/useSidebarState', () => ({
  useSidebarState: () => ({
    sidebarWidth: 400,
    sidebarHeight: 600,
    sidebarPosition: { x: 0, y: 0 },
    isResizingLeft: false,
    isResizingRight: false,
    isResizingTop: false,
    isResizingBottom: false,
    isDragging: false,
    dragStart: null,
    isGradientEnabled: false,
    isPinned: false,
    setSidebarWidth: jest.fn(),
    setSidebarHeight: jest.fn(),
    setSidebarPosition: jest.fn(),
    setIsResizingLeft: jest.fn(),
    setIsResizingRight: jest.fn(),
    setIsResizingTop: jest.fn(),
    setIsResizingBottom: jest.fn(),
    setIsDragging: jest.fn(),
    setDragStart: jest.fn(),
    handleViewAllChats: jest.fn(),
    handleToggleGradient: jest.fn(),
    handleTogglePin: jest.fn(),
    handleResetPosition: jest.fn(),
  })
}));

jest.mock('../../hooks/useResizeHandlers', () => ({
  useResizeHandlers: () => ({
    handleResizeLeftStart: jest.fn(),
    handleResizeRightStart: jest.fn(),
    handleResizeTopStart: jest.fn(),
    handleResizeBottomStart: jest.fn(),
  })
}));

jest.mock('../../hooks/useDragHandlers', () => ({
  useDragHandlers: () => ({
    handleDragStart: jest.fn(),
  })
}));

jest.mock('../../hooks/useChatData', () => ({
  useChatData: () => ({
    allChats: [
      { id: 'c1', name: 'Bob', lastMessage: 'Hello from Bob', timestamp: '10:00', unreadCount: 1, isOnline: false, isLastMessageFromMe: false, isExistingConversation: true }
    ]
  })
}));

jest.mock('../../hooks/useChatUIState', () => ({
  useChatUIState: () => ({
    selectedChat: null,
    setSelectedChat: jest.fn(),
    expandedChatId: null,
    setExpandedChatId: jest.fn(),
    showAttachMenu: false,
    setShowAttachMenu: jest.fn(),
    toggleAttachMenu: jest.fn(),
  })
}));

jest.mock('../../hooks/useMessages', () => ({
  useMessages: () => ({
    messages: [{ id: 'm1', conversation_id: 'c1', sender_id: 'u2', content: 'Hello from Bob', created_at: new Date().toISOString(), message_type: 'text', read_receipts: [] }],
    loading: false,
    sending: false,
    typingUsers: [],
    sendMessage: jest.fn(),
    editMessage: jest.fn(),
    deleteMessage: jest.fn(),
    addReaction: jest.fn(),
    removeReaction: jest.fn(),
    markAsRead: jest.fn(),
    markAllAsRead: jest.fn(),
    startTyping: jest.fn(),
    stopTyping: jest.fn(),
    refresh: jest.fn(),
  })
}));

jest.mock('../../hooks/useChatSynchronizer', () => ({
  useChatSynchronizer: () => ({
    refreshConversations: jest.fn(),
  })
}));

jest.mock('../../hooks/useChatCoordination', () => ({
  useChatCoordination: () => ({
    handleChatSelect: jest.fn(),
    handleSendQuickMessage: jest.fn(),
    handleFileUpload: jest.fn(),
    totalUnreadCount: 1,
  })
}));

jest.mock('../../hooks/useSidebarLifecycle', () => ({
  useSidebarLifecycle: () => ({
    currentUserId: 'u1',
    isMobile: false,
  })
}));

jest.mock('../../hooks/useNavigation', () => ({
  useNavigation: () => ({
    navigateToChat: navigateToChatMock,
  })
}));

// Mock supabase client to avoid import.meta usage and network calls
jest.mock('../../lib/supabase', () => ({
  supabase: {
    auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) },
    from: (table: string) => {
      if (table === 'messages') {
        return {
          // return an async chain that resolves to { data }
          select: () => ({ eq: () => ({ order: () => ({ limit: async () => ({ data: [{ id: 'm1', conversation_id: 'c1', sender_id: 'u2', content: 'Hello from Bob', created_at: new Date().toISOString(), message_type: 'text', read_receipts: [] }] }) }) }) })
        };
      }
      // default: empty data
      return ({ select: () => ({ eq: () => ({ order: () => ({ limit: async () => ({ data: [] }) }) }) }) });
    },
    channel: () => ({ on: () => ({ subscribe: jest.fn() }) }),
    removeChannel: jest.fn()
  }
}));

describe('ChatSidebar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders chat list and opens expanded chat when item clicked', async () => {
    render(
      <MemoryRouter>
        <ChatSidebar isOpen={true} onClose={() => {}} />
      </MemoryRouter>
    );

    // Expect the other user name to be present
    expect(await screen.findByText('Bob')).toBeInTheDocument();

    // Click the chat item (rendered as button or clickable element)
    const chatItem = screen.getByText('Bob');
    fireEvent.click(chatItem);

    // ExpandedChat should render message content loaded from supabase
    expect(await screen.findByText('Hello from Bob')).toBeInTheDocument();

    // loadConversations should not be called on click (only on refresh)
    expect(loadConversationsMock).not.toHaveBeenCalled();
  });
});
