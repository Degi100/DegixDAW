import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Message } from './useMessages';

export function useConversationMessages(conversationId: string | null) {
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!conversationId) return;

    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const { data } = await supabase.from('messages').select('*').eq('conversation_id', conversationId).eq('is_deleted', false).order('created_at', { ascending: true }).limit(50);
        if (mounted) setMessages((data as Message[]) || []);
      } catch {
        if (mounted) setMessages([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();

    return () => { mounted = false; };
  }, [conversationId]);

  return { messages, loading, setMessages } as const;
}
