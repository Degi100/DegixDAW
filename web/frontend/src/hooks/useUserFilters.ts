// src/hooks/useUserFilters.ts
import { useState, useMemo } from 'react';
import type { UserProfile } from './useUserData';

export interface FilterOptions {
  status: 'all' | 'active' | 'inactive' | 'pending';
  role: 'all' | 'admin' | 'user' | 'moderator';
  dateRange: 'all' | 'today' | 'week' | 'month' | 'year';
  sortBy: 'created_at' | 'last_sign_in_at' | 'email' | 'full_name';
  sortOrder: 'asc' | 'desc';
}

export function useUserFilters(users: UserProfile[]) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<FilterOptions>({
    status: 'all',
    role: 'all',
    dateRange: 'all',
    sortBy: 'created_at',
    sortOrder: 'desc'
  });

  const filteredAndSortedUsers = useMemo(() => {
    const filtered = users.filter(user => {
      // Search term filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch =
          user.email?.toLowerCase().includes(searchLower) ||
          user.username?.toLowerCase().includes(searchLower) ||
          user.full_name?.toLowerCase().includes(searchLower) ||
          user.phone?.includes(searchTerm);

        if (!matchesSearch) return false;
      }

      // Status filter
      if (filters.status !== 'all') {
        switch (filters.status) {
          case 'active':
            if (user.is_active === false) return false;
            break;
          case 'inactive':
            if (user.is_active !== false) return false;
            break;
          case 'pending':
            if (user.profile_created_at) return false;
            break;
        }
      }

      // Role filter
      if (filters.role !== 'all' && user.role !== filters.role) {
        return false;
      }

      // Date range filter
      if (filters.dateRange !== 'all') {
        const userDate = new Date(user.created_at);
        const now = new Date();

        switch (filters.dateRange) {
          case 'today':
            if (userDate.toDateString() !== now.toDateString()) return false;
            break;
          case 'week': {
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            if (userDate < weekAgo) return false;
            break;
          }
          case 'month': {
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            if (userDate < monthAgo) return false;
            break;
          }
          case 'year':
            if (userDate.getFullYear() !== now.getFullYear()) return false;
            break;
        }
      }

      return true;
    });

    // Sorting
    filtered.sort((a, b) => {
      let aVal: string | number | Date, bVal: string | number | Date;

      switch (filters.sortBy) {
        case 'created_at':
          aVal = new Date(a.created_at);
          bVal = new Date(b.created_at);
          break;
        case 'last_sign_in_at':
          aVal = a.last_sign_in_at ? new Date(a.last_sign_in_at) : new Date(0);
          bVal = b.last_sign_in_at ? new Date(b.last_sign_in_at) : new Date(0);
          break;
        case 'email':
          aVal = a.email || '';
          bVal = b.email || '';
          break;
        case 'full_name':
          aVal = a.full_name || '';
          bVal = b.full_name || '';
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return filters.sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return filters.sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [users, searchTerm, filters]);

  return {
    searchTerm,
    setSearchTerm,
    filters,
    setFilters,
    filteredAndSortedUsers
  };
}