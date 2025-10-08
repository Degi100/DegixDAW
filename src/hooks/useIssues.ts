// ============================================================================
// USE ISSUES HOOK - Supabase Integration with Realtime
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import { useToast } from './useToast';
import {
  getAllIssuesWithDetails,
  createIssue as createIssueService,
  updateIssue as updateIssueService,
  deleteIssue as deleteIssueService,
  assignIssue as assignIssueService,
  subscribeToIssues,
  unsubscribeFromIssues,
  type IssueWithDetails,
  type CreateIssueRequest,
  type UpdateIssueRequest,
  type IssueFilters as ServiceIssueFilters,
  filterIssues as filterIssuesHelper,
  sortIssues as sortIssuesHelper,
  calculateIssueStats,
  type IssueSortConfig,
} from '../lib/services/issues';

// ============================================================================
// HOOK
// ============================================================================

export function useIssues() {
  const [issues, setIssues] = useState<IssueWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { success, error: showError } = useToast();

  // ============================================================================
  // LOAD ISSUES
  // ============================================================================

  const loadIssues = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await getAllIssuesWithDetails();

      if (fetchError) throw fetchError;

      setIssues(data || []);

      console.log('[useIssues] Issues loaded:', {
        total: data?.length || 0,
        open: data?.filter((i) => i.status === 'open').length || 0,
        in_progress: data?.filter((i) => i.status === 'in_progress').length || 0,
        done: data?.filter((i) => i.status === 'done').length || 0,
        closed: data?.filter((i) => i.status === 'closed').length || 0,
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to load issues';
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [showError]);

  // ============================================================================
  // REALTIME SUBSCRIPTION
  // ============================================================================

  useEffect(() => {
    loadIssues();

    // Subscribe to realtime updates
    const subscription = subscribeToIssues((payload) => {
      console.log('[useIssues] Realtime event:', payload.eventType);

      switch (payload.eventType) {
        case 'INSERT':
          // Reload to get full details (includes user info)
          loadIssues();
          break;

        case 'UPDATE':
          // Reload to get full details
          loadIssues();
          break;

        case 'DELETE':
          setIssues((prev) => prev.filter((i) => i.id !== payload.old.id));
          break;
      }
    });

    return () => {
      unsubscribeFromIssues(subscription);
    };
  }, [loadIssues]);

  // ============================================================================
  // CRUD OPERATIONS
  // ============================================================================

  const createIssue = useCallback(
    async (request: CreateIssueRequest) => {
      try {
        const { data, error: createError } = await createIssueService(request);

        if (createError) throw createError;

        success('Issue erfolgreich erstellt! 🎉');
        // Realtime subscription will handle UI update
        return { success: true, data };
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to create issue';
        showError(errorMessage);
        return { success: false, error: errorMessage };
      }
    },
    [success, showError]
  );

  const updateIssue = useCallback(
    async (issueId: string, updates: UpdateIssueRequest) => {
      try {
        const { data, error: updateError } = await updateIssueService(
          issueId,
          updates
        );

        if (updateError) throw updateError;

        // Realtime subscription will handle UI update
        return { success: true, data };
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to update issue';
        showError(errorMessage);
        return { success: false, error: errorMessage };
      }
    },
    [showError]
  );

  const deleteIssue = useCallback(
    async (issueId: string) => {
      try {
        const { success: deleteSuccess, error: deleteError } =
          await deleteIssueService(issueId);

        if (deleteError) throw deleteError;

        success('Issue gelöscht! 🗑️');
        // Realtime subscription will handle UI update
        return { success: deleteSuccess };
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to delete issue';
        showError(errorMessage);
        return { success: false, error: errorMessage };
      }
    },
    [success, showError]
  );

  // ============================================================================
  // ASSIGNMENT
  // ============================================================================

  const assignIssue = useCallback(
    async (issueId: string, userId: string | null) => {
      try {
        const { data, error: assignError } = await assignIssueService(
          issueId,
          userId
        );

        if (assignError) throw assignError;

        if (data && !data.success) {
          showError(data.error || 'Issue is already assigned');
          return { success: false, error: data.error };
        }

        success(
          userId ? 'Issue zugewiesen! 🔒' : 'Zuweisung aufgehoben! 🔓'
        );
        // Realtime subscription will handle UI update
        return { success: true, data };
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to assign issue';
        showError(errorMessage);
        return { success: false, error: errorMessage };
      }
    },
    [success, showError]
  );

  // ============================================================================
  // FILTERING & SORTING
  // ============================================================================

  const filterIssues = useCallback(
    (filters: ServiceIssueFilters): IssueWithDetails[] => {
      return filterIssuesHelper(issues, filters);
    },
    [issues]
  );

  const sortIssues = useCallback(
    (sortConfig: IssueSortConfig): IssueWithDetails[] => {
      return sortIssuesHelper(issues, sortConfig);
    },
    [issues]
  );

  // ============================================================================
  // STATISTICS
  // ============================================================================

  const getStats = useCallback(() => {
    return calculateIssueStats(issues);
  }, [issues]);

  // ============================================================================
  // RETURN
  // ============================================================================

  return {
    issues,
    loading,
    error,
    createIssue,
    updateIssue,
    deleteIssue,
    assignIssue,
    filterIssues,
    sortIssues,
    getStats,
    refresh: loadIssues,
  };
}

// Re-export types for convenience
export type { IssueWithDetails, CreateIssueRequest, UpdateIssueRequest };
