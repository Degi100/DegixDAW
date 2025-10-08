import { renderHook } from '@testing-library/react';
import { waitFor } from '@testing-library/react';
import { useConversationMessages } from './useConversationMessages';

const makeChain = (data: unknown[]) => {
  const chain: Record<string, unknown> = {};
  const fn = () => chain;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (chain as any).select = fn;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (chain as any).eq = fn;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (chain as any).order = fn;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (chain as any).limit = fn;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (chain as any).then = (cb: (res: { data: unknown[]; error: null }) => unknown) => Promise.resolve({ data, error: null }).then(cb);
  return chain;
};

jest.mock('../lib/supabase', () => ({
  supabase: {
    from: (table: string) => {
      if (table === 'messages') return makeChain([{ conversation_id: 'c1', content: 'hi', sender_id: 'u1', created_at: new Date().toISOString(), message_type: 'text' }]);
      return makeChain([]);
    }
  }
}), { virtual: true });

describe('useConversationMessages', () => {
  it('loads messages for a conversation', async () => {
  const { result, rerender } = renderHook(({ id }) => useConversationMessages(id), { initialProps: { id: 'c1' } });

  // initial load
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.messages).toBeDefined();
  expect(Array.isArray(result.current.messages)).toBe(true);

  // change conversation id -> should reload (mock returns same shape)
  rerender({ id: 'c2' });
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.messages).toBeDefined();
  });
});
