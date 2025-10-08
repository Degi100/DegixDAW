import { useEffect, useState } from 'react';

/**
 * Hook for managing sidebar lifecycle and side effects
 */
export function useSidebarLifecycle({
  isOpen,
  playChatOpen,
  playChatClose,
  supabase,
}: {
  isOpen: boolean;
  playChatOpen: () => void;
  playChatClose: () => void;
  supabase: { auth: { getUser: () => Promise<{ data: { user: { id: string } | null } }> } };
}) {
  const [currentUserId, setCurrentUserIdState] = useState<string | null>(null);
  const [isMobile, setIsMobileState] = useState<boolean>(window.innerWidth <= 768);

  // Get current user ID
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setCurrentUserIdState(data.user?.id || null);
    };
    getUser();
  }, [supabase]);

  // Handle window resize for mobile detection
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobileState(mobile);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Play sounds on open/close
  useEffect(() => {
    if (isOpen) {
      playChatOpen();
    } else {
      playChatClose();
    }
  }, [isOpen, playChatOpen, playChatClose]);

  return {
    currentUserId,
    isMobile,
  };
}