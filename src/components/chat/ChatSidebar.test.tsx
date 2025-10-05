import { render, screen, fireEvent } from '@testing-library/react';
import ChatSidebar from './ChatSidebar';
import { MemoryRouter } from 'react-router-dom';

// Mock hooks
jest.mock('../../hooks/useConversations', () => ({
  useConversations: () => ({
    conversations: [
      { id: 'c1', type: 'direct', name: null, description: null, avatar_url: null, created_by: 'u1', created_at: '', updated_at: '', last_message_at: new Date().toISOString(), is_archived: false, unreadCount: 1, other_user: { id: 'u2', full_name: 'Bob', username: 'bob' } }
    ],
    loading: false,
    loadConversations: jest.fn(),
    createOrOpenDirectConversation: jest.fn().mockResolvedValue('c1')
  })
}));

jest.mock('../../hooks/useFriends', () => ({
  useFriends: () => ({
    friends: [
      { id: 'f1', user_id: 'u1', friend_id: 'u3', status: 'accepted', requested_at: '', created_at: '', updated_at: '', friend_profile: { full_name: 'Alice', username: 'alice' } }
    ]
  })
}));

jest.mock('../../lib/sounds/chatSounds', () => ({ useChatSounds: () => ({ playMessageReceived: jest.fn(), playChatOpen: jest.fn(), playChatClose: jest.fn() }) }));
jest.mock('../../hooks/useToast', () => ({ useToast: () => ({ success: jest.fn(), error: jest.fn() }) }));

// Mock supabase client to avoid import.meta usage and network calls
jest.mock('../../lib/supabase', () => ({
  supabase: {
    auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) },
    from: () => ({ select: () => ({ eq: () => ({ order: () => ({ limit: () => ({ data: [] }) }) }) }) }),
    channel: () => ({ on: () => ({ subscribe: jest.fn() }) }),
    removeChannel: jest.fn()
  }
}));

describe('ChatSidebar', () => {
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

    // ExpandedChat should render content (messages placeholder or quick message input)
    expect(await screen.findByPlaceholderText(/nachricht/i)).toBeInTheDocument();
  });
});
