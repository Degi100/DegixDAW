import { renderHook, act } from '@testing-library/react';
import { useChatCoordination } from './useChatCoordination';

// Mock Supabase
const supabaseUpdateMock = jest.fn();

jest.mock('../lib/supabase', () => ({
  supabase: {
    from: () => ({
      update: (data: { unread_count: number; last_read_at: string }) => {
        supabaseUpdateMock(data);
        return {
          eq: () => ({
            eq: () => Promise.resolve({ error: null })
          })
        };
      }
    })
  }
}));

describe('useChatCoordination', () => {
  const mockProps = {
    allChats: [
      { id: 'c1', unreadCount: 5, name: 'Chat 1', isExistingConversation: true },
      { id: 'c2', unreadCount: 0, name: 'Chat 2', isExistingConversation: true }
    ],
    expandedChatId: null,
    setExpandedChatId: jest.fn(),
    setSelectedChat: jest.fn(),
    playMessageReceived: jest.fn(),
    createOrOpenDirectConversation: jest.fn().mockResolvedValue('c1'),
    success: jest.fn(),
    loadConversations: jest.fn().mockResolvedValue(undefined),
    messageText: '',
    setMessageText: jest.fn(),
    expandedChatHandleSend: jest.fn().mockResolvedValue(undefined),
    setShowAttachMenu: jest.fn(),
    expandedChatHandleUpload: jest.fn().mockResolvedValue(undefined),
    currentUserId: 'u1'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    supabaseUpdateMock.mockResolvedValue({ error: null });
  });

  describe('markConversationAsRead', () => {
    it('should update database and reload conversations when chat has unread messages', async () => {
      const { result } = renderHook(() => useChatCoordination(mockProps));

      await act(async () => {
        await result.current.handleChatSelect('c1');
      });

      // Should call supabase update
      expect(supabaseUpdateMock).toHaveBeenCalledWith({
        unread_count: 0,
        last_read_at: expect.any(String)
      });

      // Should reload conversations
      expect(mockProps.loadConversations).toHaveBeenCalled();
    });

    it('should not update database when chat has no unread messages', async () => {
      const { result } = renderHook(() => useChatCoordination(mockProps));

      await act(async () => {
        await result.current.handleChatSelect('c2');
      });

      // Should not call supabase update for chat with 0 unread messages
      expect(supabaseUpdateMock).not.toHaveBeenCalled();
    });

    it('should set expanded chat state', async () => {
      const { result } = renderHook(() => useChatCoordination(mockProps));

      await act(async () => {
        await result.current.handleChatSelect('c1');
      });

      expect(mockProps.setExpandedChatId).toHaveBeenCalledWith('c1');
      expect(mockProps.setSelectedChat).toHaveBeenCalledWith('c1');
    });

    it('should close expanded chat when clicking same chat', async () => {
      const propsWithExpanded = { ...mockProps, expandedChatId: 'c1' };
      const { result } = renderHook(() => useChatCoordination(propsWithExpanded));

      await act(async () => {
        await result.current.handleChatSelect('c1');
      });

      expect(mockProps.setExpandedChatId).toHaveBeenCalledWith(null);
      expect(mockProps.setSelectedChat).not.toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      // Temporarily replace the supabase mock to return an error
      const originalMock = jest.requireMock('../lib/supabase');
      originalMock.supabase.from = () => ({
        update: () => ({
          eq: () => ({
            eq: () => Promise.resolve({ error: new Error('DB Error') })
          })
        })
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const { result } = renderHook(() => useChatCoordination(mockProps));

      await act(async () => {
        await result.current.handleChatSelect('c1');
      });

      expect(consoleSpy).toHaveBeenCalledWith('Fehler beim Markieren als gelesen:', expect.any(Error));
      expect(mockProps.loadConversations).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should play sound for chats with unread messages', async () => {
      const { result } = renderHook(() => useChatCoordination(mockProps));

      await act(async () => {
        await result.current.handleChatSelect('c1');
      });

      expect(mockProps.playMessageReceived).toHaveBeenCalled();
    });

    it('should not play sound for chats with no unread messages', async () => {
      const { result } = renderHook(() => useChatCoordination(mockProps));

      await act(async () => {
        await result.current.handleChatSelect('c2');
      });

      expect(mockProps.playMessageReceived).not.toHaveBeenCalled();
    });
  });

  describe('handleSendQuickMessage', () => {
    it('should send message and clear text', async () => {
      const propsWithText = { ...mockProps, messageText: 'Hello' };
      const { result } = renderHook(() => useChatCoordination(propsWithText));

      await act(async () => {
        await result.current.handleSendQuickMessage();
      });

      expect(mockProps.expandedChatHandleSend).toHaveBeenCalledWith('Hello');
      expect(mockProps.setMessageText).toHaveBeenCalledWith('');
    });
  });

  describe('handleFileUpload', () => {
    it('should upload file and hide menu', async () => {
      const mockFile = new File(['test'], 'test.txt');
      const { result } = renderHook(() => useChatCoordination(mockProps));

      await act(async () => {
        await result.current.handleFileUpload('c1', mockFile);
      });

      expect(mockProps.setShowAttachMenu).toHaveBeenCalledWith(false);
      expect(mockProps.expandedChatHandleUpload).toHaveBeenCalledWith('c1', mockFile);
    });
  });
});