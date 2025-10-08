import { renderHook } from '@testing-library/react';
import { useGlobalMessagesSubscription } from './useGlobalMessagesSubscription';

jest.mock('../lib/supabase', () => {
  const mockChannel = {
    on: jest.fn().mockReturnThis(),
    subscribe: jest.fn().mockResolvedValue('ok'),
  };
  return {
    supabase: {
      channel: jest.fn(() => mockChannel),
      removeChannel: jest.fn(),
    }
  };
});

describe('useGlobalMessagesSubscription', () => {
  it('subscribes and removes channel on unmount', async () => {
    const onInsert = jest.fn();
    const { unmount } = renderHook(() => useGlobalMessagesSubscription({ channelId: 'test:1', enabled: true, onInsert }));

    // allow effect to run
    await Promise.resolve();

  const mod = await import('../lib/supabase');
  expect(mod.supabase.channel).toHaveBeenCalledWith('test:1');
  // cleanup
  unmount();
  expect(mod.supabase.removeChannel).toHaveBeenCalled();
  });
});
