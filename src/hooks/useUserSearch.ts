// src/hooks/useUserSearch.ts
// User Search Hook

import { useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';

export interface SearchUser {
  id: string;
  full_name: string;
  username: string;
  created_at: string;
}

export function useUserSearch() {
  const [results, setResults] = useState<SearchUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Search users by name or username
  const searchUsers = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    setSearchTerm(query);

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, username, created_at')
        .or(`full_name.ilike.%${query}%,username.ilike.%${query}%`)
        .limit(20);

      if (error) throw error;

      // Exclude current user
      const currentUser = await supabase.auth.getUser();
      const filtered = (data || []).filter(user => user.id !== currentUser.data.user?.id);

      setResults(filtered);
    } catch (err) {
      console.error('Error searching users:', err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Clear search
  const clearSearch = useCallback(() => {
    setResults([]);
    setSearchTerm('');
  }, []);

  // Debounced search (optional) - useRef based timeout to satisfy linting
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedSearch = useCallback((query: string, delay = 300) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    debounceTimeoutRef.current = setTimeout(() => {
      searchUsers(query);
    }, delay);
  }, [searchUsers]);

  return {
    results,
    loading,
    searchTerm,
    searchUsers,
    debouncedSearch,
    clearSearch,
  };
}
