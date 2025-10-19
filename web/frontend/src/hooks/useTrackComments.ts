// ============================================
// USE TRACK COMMENTS HOOK
// Manage comments for a specific track
// ============================================

import { useState, useEffect, useCallback } from 'react';
import {
  getTrackComments,
  createTrackComment,
  updateTrackComment,
  deleteTrackComment,
  toggleCommentResolved,
  subscribeToTrackComments,
} from '../lib/services/tracks/commentsService';
import type {
  TrackComment,
  CreateTrackCommentRequest,
  UpdateTrackCommentRequest,
} from '../types/tracks';

export function useTrackComments(trackId: string | null) {
  const [comments, setComments] = useState<TrackComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ============================================
  // Fetch Comments
  // ============================================

  const fetchComments = useCallback(async () => {
    if (!trackId) {
      setComments([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await getTrackComments(trackId);
      setComments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load comments');
    } finally {
      setLoading(false);
    }
  }, [trackId]);

  // ============================================
  // Initial Load
  // ============================================

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  // ============================================
  // Realtime Subscription
  // ============================================

  useEffect(() => {
    if (!trackId) return;

    const unsubscribe = subscribeToTrackComments(trackId, setComments);
    return unsubscribe;
  }, [trackId]);

  // ============================================
  // Create Comment
  // ============================================

  const create = useCallback(
    async (data: Omit<CreateTrackCommentRequest, 'track_id'>): Promise<TrackComment | null> => {
      if (!trackId) return null;

      const comment = await createTrackComment({
        track_id: trackId,
        ...data,
      });

      if (comment) {
        // No need to manually update - realtime subscription will handle it
        // But we can optimistically add it
        setComments((prev) => [...prev, comment].sort((a, b) => a.timestamp_ms - b.timestamp_ms));
      }

      return comment;
    },
    [trackId]
  );

  // ============================================
  // Update Comment
  // ============================================

  const update = useCallback(
    async (commentId: string, updates: UpdateTrackCommentRequest): Promise<TrackComment | null> => {
      const updated = await updateTrackComment(commentId, updates);

      if (updated) {
        setComments((prev) =>
          prev.map((c) => (c.id === commentId ? updated : c))
        );
      }

      return updated;
    },
    []
  );

  // ============================================
  // Delete Comment
  // ============================================

  const remove = useCallback(async (commentId: string): Promise<boolean> => {
    const success = await deleteTrackComment(commentId);

    if (success) {
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    }

    return success;
  }, []);

  // ============================================
  // Toggle Resolved
  // ============================================

  const toggleResolved = useCallback(async (commentId: string): Promise<TrackComment | null> => {
    const updated = await toggleCommentResolved(commentId);

    if (updated) {
      setComments((prev) =>
        prev.map((c) => (c.id === commentId ? updated : c))
      );
    }

    return updated;
  }, []);

  // ============================================
  // Get Comments at Timestamp
  // ============================================

  const getCommentsAt = useCallback(
    (timestampMs: number, toleranceMs: number = 500): TrackComment[] => {
      return comments.filter(
        (c) => Math.abs(c.timestamp_ms - timestampMs) <= toleranceMs
      );
    },
    [comments]
  );

  // ============================================
  // Get Unresolved Count
  // ============================================

  const unresolvedCount = comments.filter((c) => !c.is_resolved).length;

  return {
    comments,
    loading,
    error,
    create,
    update,
    remove,
    toggleResolved,
    getCommentsAt,
    unresolvedCount,
    refetch: fetchComments,
  };
}
