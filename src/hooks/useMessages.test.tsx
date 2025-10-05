import { render, screen, waitFor } from '@testing-library/react';
import { useMessages } from './useMessages';

// Helper test component to expose hook state
function TestMessages({ conversationId }: { conversationId: string | null }) {
  const { messages, loading } = useMessages(conversationId);
  if (loading) return <div>loading</div>;
  return (
    <div>
      {messages.map(m => (
        <div key={m.id}>{m.content}</div>
      ))}
    </div>
  );
}

// Mock supabase similar to other tests
jest.mock('../lib/supabase', () => {
  const messages = [ { id: 'm1', conversation_id: 'c1', sender_id: 'u2', content: 'Hello', message_type: 'text', is_edited: false, edited_at: null, is_deleted: false, deleted_at: null, reply_to_id: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), read_receipts: [] } ];
  const profiles = [ { id: 'u2', full_name: 'Bob', username: 'bob' } ];

  const makeChain = (data: unknown[]) => {
    const chain: Record<string, unknown> = {};
    const fn = () => chain;
  // test helper: allow any here to build chainable API
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (chain as any).select = fn;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (chain as any).eq = fn;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (chain as any).in = fn;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (chain as any).order = fn;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (chain as any).limit = fn;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (chain as any).neq = fn;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (chain as any).then = (cb: (res: { data: unknown[]; error: null }) => unknown) => Promise.resolve({ data, error: null }).then(cb);
    return chain;
  };

  return {
    supabase: {
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) },
      from: (table: string) => {
        if (table === 'messages') return makeChain(messages);
        if (table === 'profiles') return makeChain(profiles);
        if (table === 'message_reactions') return makeChain([]);
        if (table === 'message_attachments') return makeChain([]);
        if (table === 'message_read_receipts') return makeChain([]);
        if (table === 'typing_indicators') return makeChain([]);
        return makeChain([]);
      },
      channel: () => ({ on: () => ({ subscribe: jest.fn() }) }),
      removeChannel: jest.fn()
    }
  };
}, { virtual: true });

describe('useMessages', () => {
  it('loads and renders messages for a conversation', async () => {
    render(<TestMessages conversationId="c1" />);

    await waitFor(() => expect(screen.queryByText('loading')).not.toBeInTheDocument());

    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
