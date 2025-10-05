import { useEffect } from 'react';
import { supabase } from '../lib/supabase';

type Callback = (payload: unknown) => void;

interface Options {
  channelId: string;
  enabled?: boolean;
  onInsert?: Callback;
}

/**
 * Hook: subscribe to Postgres INSERT events for messages table for a given channel
 * Keeps subscription lifecycle centralized and testable.
 */
export function useGlobalMessagesSubscription({ channelId, enabled = true, onInsert }: Options) {
  useEffect(() => {
    if (!enabled || !channelId) return;

    // supabase.channel(...) returns a Channel object synchronously; subscribe() may return a Promise-like
    const channel = supabase.channel(channelId);
    channel.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload: unknown) => {
      if (onInsert) onInsert(payload);
    });
    // start subscription (we don't await it here) — some mocks may not expose subscribe
    const maybeChannel: unknown = channel;
    const chanWithSubscribe = maybeChannel as { subscribe?: () => unknown };
    if (typeof chanWithSubscribe.subscribe === 'function') {
      chanWithSubscribe.subscribe();
    }

    return () => {
      supabase.removeChannel(channel);
    };
  }, [channelId, enabled, onInsert]);
}
