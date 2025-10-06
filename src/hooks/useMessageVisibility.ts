import { useEffect, useRef, useCallback } from 'react';

/**
 * Hook zum Tracken der Sichtbarkeit von Nachrichten
 * Verwendet Intersection Observer API um zu erkennen, wenn Nachrichten in den Viewport scrollen
 */
interface UseMessageVisibilityProps {
  /** ID des aktuell geöffneten Chats */
  chatId: string | null;
  /** Funktion zum Markieren einer Konversation als gelesen */
  markConversationAsRead: (chatId: string) => Promise<void>;
  /** Ob der Chat aktuell geöffnet ist */
  isOpen: boolean;
  /** Container-Ref für den Scroll-Bereich */
  containerRef: React.RefObject<HTMLDivElement | null>;
}

/**
 * Custom hook für scroll-basiertes Markieren als gelesen
 * 
 * Markiert eine Konversation automatisch als gelesen, wenn:
 * - Die letzte Nachricht in den Viewport gescrollt wurde
 * - Der Chat mindestens 500ms sichtbar war (debounced)
 * 
 * @param props - Hook configuration
 * @returns Callback zum Registrieren der letzten Nachricht
 */
export function useMessageVisibility({
  chatId,
  markConversationAsRead,
  isOpen,
  containerRef,
}: UseMessageVisibilityProps) {
  const lastMessageRef = useRef<HTMLDivElement | null>(null);
  const markAsReadTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasMarkedAsReadRef = useRef<string | null>(null);

  // Callback zum Setzen der letzten Nachricht (wird von außen aufgerufen)
  const setLastMessageRef = useCallback((element: HTMLDivElement | null) => {
    lastMessageRef.current = element;
  }, []);

  // Intersection Observer Setup
  useEffect(() => {
    if (!chatId || !isOpen || !lastMessageRef.current || !containerRef.current) {
      return;
    }

    // Skip wenn bereits als gelesen markiert
    if (hasMarkedAsReadRef.current === chatId) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            console.log('👁️ Letzte Nachricht ist sichtbar, starte Timer...');
            
            // Clear existing timeout
            if (markAsReadTimeoutRef.current) {
              clearTimeout(markAsReadTimeoutRef.current);
            }

            // Debounce: Warte 500ms bevor als gelesen markiert wird
            markAsReadTimeoutRef.current = setTimeout(async () => {
              if (chatId && hasMarkedAsReadRef.current !== chatId) {
                console.log('✅ Markiere als gelesen nach Scroll:', chatId);
                hasMarkedAsReadRef.current = chatId;
                await markConversationAsRead(chatId);
              }
            }, 500);
          } else {
            // Wenn aus dem Viewport gescrollt wird, Timer abbrechen
            if (markAsReadTimeoutRef.current) {
              clearTimeout(markAsReadTimeoutRef.current);
              markAsReadTimeoutRef.current = null;
            }
          }
        });
      },
      {
        root: containerRef.current,
        threshold: 0.5, // 50% der Nachricht muss sichtbar sein
      }
    );

    observer.observe(lastMessageRef.current);

    return () => {
      observer.disconnect();
      if (markAsReadTimeoutRef.current) {
        clearTimeout(markAsReadTimeoutRef.current);
      }
    };
  }, [chatId, isOpen, markConversationAsRead, containerRef]);

  // Reset tracking wenn Chat wechselt
  useEffect(() => {
    if (hasMarkedAsReadRef.current !== chatId) {
      hasMarkedAsReadRef.current = null;
    }
  }, [chatId]);

  return {
    setLastMessageRef,
  };
}
