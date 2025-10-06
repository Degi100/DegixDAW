// React import not required with new JSX runtime
import { render, screen, waitFor } from '@testing-library/react';
import { useConversations } from './useConversations';

// Simple static mock of supabase that returns predetermined results per table
const supResponses: Record<string, unknown[]> = {
  conversation_members: [
    { conversation_id: 'c1', last_read_at: null, is_pinned: false, user_id: 'u1' },
    { conversation_id: 'c1', last_read_at: null, is_pinned: false, user_id: 'u2' }
  ],
  conversations: [
    { id: 'c1', type: 'direct', name: null, description: null, avatar_url: null, created_by: 'u1', created_at: '', updated_at: '', last_message_at: new Date().toISOString(), is_archived: false }
  ],
  conversation_members_all: [
    { conversation_id: 'c1', user_id: 'u1', role: 'admin', joined_at: '', last_read_at: null, is_muted: false, is_pinned: false },
    { conversation_id: 'c1', user_id: 'u2', role: 'member', joined_at: '', last_read_at: null, is_muted: false, is_pinned: false }
  ],
  profiles: [
    { id: 'u1', full_name: 'Me', username: 'me' },
    { id: 'u2', full_name: 'Bob', username: 'bob' }
  ],
  messages: [
    { conversation_id: 'c1', content: 'Hello', sender_id: 'u2', created_at: new Date().toISOString(), message_type: 'text' }
  ]
};

  const makeChain = (data: unknown[]) => {
  const chain: Record<string, unknown> = {};
  const fn = () => chain;
  // test helper: allow any here to build chainable API
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (chain as any).select = fn;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (chain as any).in = fn;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (chain as any).eq = fn;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (chain as any).order = fn;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (chain as any).limit = fn;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (chain as any).single = async () => ({ data: data[0] || null, error: null });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (chain as any).then = (cb: (res: { data: unknown[]; error: null }) => unknown) => Promise.resolve({ data, error: null }).then(cb);
  return chain;
};

jest.mock('../lib/supabase', () => ({
  supabase: {
    auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) },
    from: (table: string) => {
      if (table === 'conversation_members') return makeChain(supResponses.conversation_members);
      if (table === 'conversations') return makeChain(supResponses.conversations);
      if (table === 'profiles') return makeChain(supResponses.profiles);
      if (table === 'messages') return makeChain(supResponses.messages);
      if (table === 'conversation_members_all') return makeChain(supResponses.conversation_members_all);
      return makeChain([]);
    },
    channel: () => ({ on: () => ({ subscribe: jest.fn() }) }),
    removeChannel: jest.fn()
  }
}), { virtual: true });

// Helper component to expose hook values
function TestComponent() {
  const { conversations } = useConversations();
  return (
    <div>
      {conversations.map(c => (
        <div key={c.id} data-testid="conv">
          {c.other_user?.full_name || c.name}
        </div>
      ))}
    </div>
  );
}

describe('useConversations hook', () => {
  it('loads and enriches conversations', async () => {
    render(<TestComponent />);

    await waitFor(() => expect(screen.queryByText('loading')).not.toBeInTheDocument());

    // Bob (other_user) should be displayed
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('handles empty memberships (no conversations)', async () => {
    // mutate the module-scoped responses to simulate empty memberships
    supResponses.conversation_members = [];
    supResponses.conversations = [];
    supResponses.conversation_members_all = [];
    supResponses.profiles = [];
    supResponses.messages = [];

    render(<TestComponent />);

    await waitFor(() => expect(screen.queryByText('loading')).not.toBeInTheDocument());

    // No conversation elements should be rendered
    expect(screen.queryByTestId('conv')).toBeNull();
  });
});
