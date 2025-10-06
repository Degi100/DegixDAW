import { render, screen, waitFor } from '@testing-library/react';
import { useConversations } from './useConversations';

// Create a mock that returns error for conversation_members
jest.mock('../lib/supabase', () => ({
  supabase: {
    auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) },
    from: (table: string) => {
      if (table === 'conversation_members') {
        return {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          select: () => ({ eq: () => ({ then: (cb: any) => Promise.resolve(cb({ data: null, error: { message: 'db-error' } })) }) })
        };
      }
      return {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        select: () => ({ then: (cb: any) => Promise.resolve(cb({ data: [] })) })
      };
    },
    channel: () => ({ on: () => ({ subscribe: jest.fn() }) }),
    removeChannel: jest.fn()
  }
}), { virtual: true });

function TestComponent() {
  const { conversations, loading } = useConversations();
  if (loading) return <div>loading</div>;
  return (
    <div>
      {conversations.map(c => (
        <div key={c.id} data-testid="conv">{c.id}</div>
      ))}
    </div>
  );
}

describe('useConversations error handling', () => {
  it('does not crash when supabase returns an error for memberships', async () => {
    render(<TestComponent />);
    await waitFor(() => expect(screen.queryByText('loading')).not.toBeInTheDocument());
    expect(screen.queryByTestId('conv')).toBeNull();
  });
});
