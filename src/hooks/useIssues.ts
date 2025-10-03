// src/hooks/useIssues.ts
// CRUD Hook for Issues Management System

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from './useToast';

export interface Issue {
  id: string;
  title: string;
  description: string | null;
  status: 'open' | 'in-progress' | 'done' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  assigned_to: string | null;
  tags: string[] | null;
  due_date: string | null;
  resolved_at: string | null;
}

export interface IssueFilters {
  status?: string;
  priority?: string;
  category?: string;
  search?: string;
}

export interface NewIssue {
  title: string;
  description?: string;
  status?: Issue['status'];
  priority?: Issue['priority'];
  category?: string;
  tags?: string[];
  due_date?: string;
}

export function useIssues() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { success, error: showError } = useToast();

  // Load all issues
  const loadIssues = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('issues')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setIssues(data || []);
      
      // Debug: Log stats
      console.log('📊 Issues geladen:', {
        total: data?.length || 0,
        open: data?.filter(i => i.status === 'open').length || 0,
        inProgress: data?.filter(i => i.status === 'in-progress').length || 0,
        done: data?.filter(i => i.status === 'done').length || 0,
        closed: data?.filter(i => i.status === 'closed').length || 0,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load issues';
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [showError]);

  // Initial load
  useEffect(() => {
    loadIssues();
  }, [loadIssues]);

  // Create new issue
  const createIssue = useCallback(async (newIssue: NewIssue) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const issueData = {
        ...newIssue,
        created_by: user?.id || null,
        status: newIssue.status || 'open',
        priority: newIssue.priority || 'medium',
      };

      const { data, error: insertError } = await supabase
        .from('issues')
        .insert([issueData])
        .select()
        .single();

      if (insertError) throw insertError;

      setIssues(prev => [data, ...prev]);
      success('Issue erfolgreich erstellt! 🎉');
      return { success: true, data };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create issue';
      showError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, [success, showError]);

  // Update existing issue
  const updateIssue = useCallback(async (id: string, updates: Partial<Issue>) => {
    try {
      // Optimistic update: Update UI immediately
      const optimisticIssue = { ...updates, updated_at: new Date().toISOString() };
      
      setIssues(prev => prev.map(issue => 
        issue.id === id ? { ...issue, ...optimisticIssue } : issue
      ));

      const { data, error: updateError } = await supabase
        .from('issues')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      // Sync with server response
      setIssues(prev => prev.map(issue => issue.id === id ? data : issue));
      
      return { success: true, data };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update issue';
      showError(errorMessage);
      // Revert optimistic update by reloading
      loadIssues();
      return { success: false, error: errorMessage };
    }
  }, [showError, loadIssues]);

  // Delete issue
  const deleteIssue = useCallback(async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('issues')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      setIssues(prev => prev.filter(issue => issue.id !== id));
      success('Issue gelöscht! 🗑️');
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete issue';
      showError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, [success, showError]);

  // Filter issues (client-side for now)
  const filterIssues = useCallback((filters: IssueFilters): Issue[] => {
    return issues.filter(issue => {
      // Status filter
      if (filters.status && filters.status !== 'all' && issue.status !== filters.status) {
        return false;
      }

      // Priority filter
      if (filters.priority && filters.priority !== 'all' && issue.priority !== filters.priority) {
        return false;
      }

      // Category filter
      if (filters.category && filters.category !== 'all' && issue.category !== filters.category) {
        return false;
      }

      // Search filter (title + description)
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const titleMatch = issue.title.toLowerCase().includes(searchLower);
        const descMatch = issue.description?.toLowerCase().includes(searchLower);
        if (!titleMatch && !descMatch) {
          return false;
        }
      }

      return true;
    });
  }, [issues]);

  // Get statistics
  const getStats = useCallback(() => {
    const total = issues.length;
    const open = issues.filter(i => i.status === 'open').length;
    const inProgress = issues.filter(i => i.status === 'in-progress').length;
    const done = issues.filter(i => i.status === 'done').length;
    const high = issues.filter(i => i.priority === 'high').length;
    const critical = issues.filter(i => i.priority === 'critical').length;

    return {
      total,
      open,
      inProgress,
      done,
      closed: issues.filter(i => i.status === 'closed').length,
      highPriority: high,
      criticalPriority: critical,
      urgentCount: high + critical,
    };
  }, [issues]);

  return {
    issues,
    loading,
    error,
    createIssue,
    updateIssue,
    deleteIssue,
    filterIssues,
    getStats,
    refresh: loadIssues,
  };
}
