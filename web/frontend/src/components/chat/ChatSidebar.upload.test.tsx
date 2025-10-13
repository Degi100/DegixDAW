import { render, fireEvent, waitFor } from '@testing-library/react';
import ChatSidebar from './ChatSidebar';
import { MemoryRouter } from 'react-router-dom';

// Mock supabase in a way that supports storage upload and messages insert
const successMock = jest.fn();

// create jest.fn references we can assert on
const uploadMock = jest.fn().mockResolvedValue({ data: { path: 'u1/1234.png' }, error: null });
const getPublicUrlMock = jest.fn().mockReturnValue({ data: { publicUrl: 'https://cdn.example/u1/1234.png' } });
const insertMock = jest.fn().mockResolvedValue({ data: [], error: null });

jest.mock('../../lib/supabase', () => ({
  supabase: {
    auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) },
    storage: {
      from: () => ({
        upload: uploadMock,
        getPublicUrl: getPublicUrlMock
      })
    },
    from: (table: string) => {
      if (table === 'messages') {
        return {
          select: () => ({ eq: () => ({ order: () => ({ limit: async () => ({ data: [] }) }) }) }),
          insert: insertMock
        };
      }
      return { insert: insertMock };
    },
    channel: () => ({ on: () => ({ subscribe: jest.fn() }) }),
    removeChannel: jest.fn()
  }
}), { virtual: true });

jest.mock('../../hooks/useToast', () => ({ useToast: () => ({ success: successMock, error: jest.fn() }) }));
jest.mock('../../hooks/useConversations', () => ({
  useConversations: () => ({
    conversations: [
      { id: 'c1', type: 'direct', name: null, description: null, avatar_url: null, created_by: 'u1', created_at: '', updated_at: '', last_message_at: new Date().toISOString(), is_archived: false, unreadCount: 1, other_user: { id: 'u2', full_name: 'Bob', username: 'bob' } }
    ],
    loadConversations: jest.fn(),
    createOrOpenDirectConversation: jest.fn().mockResolvedValue('c1')
  })
}));

jest.mock('../../hooks/useFriends', () => ({ useFriends: () => ({ friends: [] }) }));
jest.mock('../../lib/sounds/chatSounds', () => ({ useChatSounds: () => ({ playMessageReceived: jest.fn(), playChatOpen: jest.fn(), playChatClose: jest.fn() }) }));

describe('ChatSidebar file upload', () => {
  it('uploads file and inserts message', async () => {
    render(
      <MemoryRouter>
        <ChatSidebar isOpen={true} onClose={() => {}} />
      </MemoryRouter>
    );

  // Wait for the chat item to render so hooks complete
  // Click the chat item to open ExpandedChat (which contains the hidden file input)
  const chatButton = document.querySelector('button.chat-item');
  if (chatButton) fireEvent.click(chatButton as Element);
  await waitFor(() => expect(document.querySelector('button.chat-item')).toBeTruthy());

  // Find the hidden file input and simulate file selection
  const input = document.querySelector('input[type="file"]') as HTMLInputElement | null;
  expect(input).not.toBeNull();
    const file = new File(['dummy'], 'test.png', { type: 'image/png' });

  // Simulate file change
  fireEvent.change(input!, { target: { files: [file] } });

    // Expect upload flow to complete, storage/upload called and message inserted
    await waitFor(() => {
      expect(uploadMock).toHaveBeenCalled();
      expect(getPublicUrlMock).toHaveBeenCalled();
      expect(insertMock).toHaveBeenCalled();
      expect(successMock).toHaveBeenCalled();
    });
  });
});
