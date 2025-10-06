import { useMemo } from 'react';
import { formatTime } from '../lib/timeUtils';
import type { Conversation } from './useConversations';
import type { Friendship } from './useFriends';

/**
 * Props for the useChatData hook
 */
interface UseChatDataProps {
  conversations: Conversation[];
  friends: Friendship[];
  currentUserId: string | null;
  expandedChatId?: string | null;
}

/**
 * Represents a chat item in the sidebar
 */
interface ChatItem {
  id: string;
  name: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  isOnline: boolean;
  avatar?: string | undefined;
  isLastMessageFromMe?: boolean;
  isExistingConversation?: boolean;
  friendId?: string;
}

/**
 * Custom hook for aggregating chat data from conversations and friends
 *
 * Consolidates real conversations and friends without conversations into a single ChatItem array.
 *
 * @param props - Hook configuration
 * @returns Object containing the aggregated chat list
 */
export function useChatData({ conversations, friends, currentUserId, expandedChatId }: UseChatDataProps) {
  const allChats = useMemo(() => {
    // Echte Conversations aus der Datenbank
    const realChats: ChatItem[] = conversations.map(conv => {
      const lastMessage = conv.lastMessage || conv.last_message;
      const isLastMessageFromMe = currentUserId && lastMessage?.sender_id === currentUserId;

      return {
        id: conv.id,
        name: conv.other_user?.full_name || conv.name || 'Unbekannt',
        lastMessage: lastMessage?.content || 'Keine Nachrichten',
        timestamp: formatTime(conv.last_message_at),
        unreadCount: conv.unreadCount || conv.unread_count || 0,
        isOnline: false, // TODO: Online-Status aus User-Daten laden
        avatar: conv.avatar_url || undefined,
        isLastMessageFromMe: isLastMessageFromMe || false,
        isExistingConversation: true,
      };
    });

    // Freunde ohne Conversations (für neue Chats)
    const friendsWithoutChats: ChatItem[] = friends
      .filter(friendship => {
        // Prüfe ob bereits eine Conversation mit diesem Freund existiert
        const hasConversation = conversations.some(conv =>
          conv.other_user?.id === friendship.friend_id ||
          conv.members?.some(member => member.user_id === friendship.friend_id)
        );
        return !hasConversation && friendship.status === 'accepted';
      })
      .map(friendship => ({
        id: `friend-${friendship.friend_id}`,
        name: friendship.friend_profile?.full_name || friendship.friend_profile?.username || 'Unbekannt',
        lastMessage: 'Chat starten...',
        timestamp: 'Nie',
        unreadCount: 0,
        isOnline: false, // TODO: Online-Status aus User-Daten laden
        avatar: undefined, // TODO: Avatar aus friend_profile laden
        isLastMessageFromMe: false,
        isExistingConversation: false,
        friendId: friendship.friend_id,
      }));

    // Kombiniere: Echte Conversations + Freunde ohne Chats
    const combinedChats = [...realChats, ...friendsWithoutChats];

    // Sortiere: Aktueller Chat ganz oben, dann nach letzter Nachricht sortiert
    return combinedChats.sort((a, b) => {
      // Aktueller Chat immer ganz oben
      if (expandedChatId) {
        if (a.id === expandedChatId) return -1;
        if (b.id === expandedChatId) return 1;
      }

      // Bei echten Conversations: Nach letzter Nachricht sortieren (neueste zuerst)
      if (a.isExistingConversation && b.isExistingConversation) {
        const aTime = conversations.find(c => c.id === a.id)?.last_message_at;
        const bTime = conversations.find(c => c.id === b.id)?.last_message_at;

        if (aTime && bTime) {
          return new Date(bTime).getTime() - new Date(aTime).getTime();
        }
        if (aTime) return -1;
        if (bTime) return 1;
      }

      // Freunde ohne Conversations ans Ende
      if (!a.isExistingConversation && b.isExistingConversation) return 1;
      if (a.isExistingConversation && !b.isExistingConversation) return -1;

      return 0;
    });
  }, [conversations, friends, currentUserId, expandedChatId]);

  return { allChats };
}