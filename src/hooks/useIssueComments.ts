// ============================================================================
// USE ISSUE COMMENTS HOOK - Supabase Integration with Realtime
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import { useToast } from './useToast';
import {
  getIssueComments,
  createComment,
  deleteComment,
  createStatusChangeComment,
  createAssignmentComment,
  subscribeToIssueComments,
  unsubscribeFromIssueComments,
  type IssueCommentWithUser,
  type CreateCommentRequest,
} from '../lib/services/issues';

// ============================================================================
// HOOK
// ============================================================================

export function useIssueComments(issueId: string | null) {
  const [comments, setComments] = useState<IssueCommentWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { success, error: showError } = useToast();

  // ============================================================================
  // LOAD COMMENTS
  // ============================================================================

  const loadComments = useCallback(async () => {
    if (!issueId) {
      setComments([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await getIssueComments(issueId);

      if (fetchError) throw fetchError;

      setComments(data || []);

      console.log('[useIssueComments] Comments loaded:', {
        issueId,
        count: data?.length || 0,
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to load comments';
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [issueId, showError]);

  // ============================================================================
  // REALTIME SUBSCRIPTION
  // ============================================================================

  useEffect(() => {
    if (!issueId) return;

    loadComments();

    // Subscribe to realtime updates for this issue
    const subscription = subscribeToIssueComments(issueId, (payload) => {
      console.log('[useIssueComments] Realtime event:', payload.eventType);

      switch (payload.eventType) {
        case 'INSERT':
          // Reload to get full comment with user details
          loadComments();
          break;

        case 'DELETE':
          setComments((prev) => prev.filter((c) => c.id !== payload.old.id));
          break;

        case 'UPDATE':
          // Reload to get updated comment
          loadComments();
          break;
      }
    });

    return () => {
      unsubscribeFromIssueComments(subscription);
    };
  }, [issueId, loadComments]);

  // ============================================================================
  // CRUD OPERATIONS
  // ============================================================================

  const addComment = useCallback(
    async (request: CreateCommentRequest) => {
      try {
        const { data, error: createError } = await createComment(request);

        if (createError) throw createError;

        success('Kommentar hinzugefügt! 💬');
        // Realtime subscription will handle UI update
        return { success: true, data };
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to add comment';
        showError(errorMessage);
        return { success: false, error: errorMessage };
      }
    },
    [success, showError]
  );

  const removeComment = useCallback(
    async (commentId: string) => {
      try {
        // OPTIMISTIC UPDATE: Remove from UI immediately
        setComments((prev) => prev.filter((c) => c.id !== commentId));

        const { success: deleteSuccess, error: deleteError } =
          await deleteComment(commentId);

        if (deleteError) throw deleteError;

        success('Kommentar gelöscht! 🗑️');
        return { success: deleteSuccess };
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to delete comment';
        showError(errorMessage);

        // ROLLBACK: Reload comments on error
        loadComments();
        return { success: false, error: errorMessage };
      }
    },
    [success, showError, loadComments]
  );

  // ============================================================================
  // AUTOMATIC COMMENTS (Status/Assignment Changes)
  // ============================================================================

  const addStatusChangeComment = useCallback(
    async (oldStatus: string, newStatus: string, reason?: string) => {
      if (!issueId) return { success: false, error: 'No issue ID' };

      try {
        const { data, error: createError } = await createStatusChangeComment(
          issueId,
          oldStatus,
          newStatus,
          reason
        );

        if (createError) throw createError;

        // Realtime subscription will handle UI update
        return { success: true, data };
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to add status comment';
        console.error('[useIssueComments] Status comment error:', errorMessage);
        return { success: false, error: errorMessage };
      }
    },
    [issueId]
  );

  const addAssignmentComment = useCallback(
    async (
      oldAssignee: string | null,
      newAssignee: string | null,
      comment?: string
    ) => {
      if (!issueId) return { success: false, error: 'No issue ID' };

      try {
        const { data, error: createError } = await createAssignmentComment(
          issueId,
          oldAssignee,
          newAssignee,
          comment
        );

        if (createError) throw createError;

        // Realtime subscription will handle UI update
        return { success: true, data };
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : 'Failed to add assignment comment';
        console.error(
          '[useIssueComments] Assignment comment error:',
          errorMessage
        );
        return { success: false, error: errorMessage };
      }
    },
    [issueId]
  );

  // ============================================================================
  // RETURN
  // ============================================================================

  return {
    comments,
    loading,
    error,
    addComment,
    removeComment,
    addStatusChangeComment,
    addAssignmentComment,
    refresh: loadComments,
  };
}

// Re-export types for convenience
export type { IssueCommentWithUser, CreateCommentRequest };
