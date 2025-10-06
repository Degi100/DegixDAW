import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Hook for navigation utilities
 */
export function useNavigation() {
  const navigate = useNavigate();

  const navigateToChat = useCallback((id: string) => {
    navigate(`/chat/${id}`);
  }, [navigate]);

  return {
    navigateToChat,
  };
}