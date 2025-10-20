// ============================================
// TRACK COMMENTS SERVICE
// CRUD operations for timestamp-based track comments
// ============================================

import { supabase } from '../../supabase';
import type {
  TrackComment,
  CreateTrackCommentRequest,
  UpdateTrackCommentRequest,
} from '../../../types/tracks';

// ============================================
// Get Comments for Track
// ============================================

export async function getTrackComments(trackId: string): Promise<TrackComment[]> {
  try {
    // Step 1: Get comments
    const { data: comments, error } = await supabase
      .from('track_comments')
      .select(`
        id,
        track_id,
        author_id,
        content,
        timestamp_ms,
        is_resolved,
        created_at,
        updated_at
      `)
      .eq('track_id', trackId)
      .order('timestamp_ms', { ascending: true });

    if (error) {
      console.error('Error fetching track comments:', error);
      throw error;
    }

    if (!comments || comments.length === 0) return [];

    // Step 2: Get unique author IDs
    const authorIds = [...new Set(comments.map((c) => c.author_id))];

    // Step 3: Fetch profiles for all authors
    let profilesQuery = supabase
      .from('profiles')
      .select('id, username, avatar_url');

    // Use .eq() for single author, .in() for multiple (avoids encoding issues)
    if (authorIds.length === 1) {
      profilesQuery = profilesQuery.eq('id', authorIds[0]);
    } else {
      profilesQuery = profilesQuery.in('id', authorIds);
    }

    const { data: profiles, error: profilesError } = await profilesQuery;

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      // Continue without profiles
    }

    // Step 4: Map profiles to comments
    const profilesMap = new Map(profiles?.map((p) => [p.id, p]) || []);

    return comments.map((comment) => {
      const profile = profilesMap.get(comment.author_id);
      return {
        ...comment,
        username: profile?.username || null,
        avatar_url: profile?.avatar_url || null
      };
    });
  } catch (error) {
    console.error('getTrackComments failed:', error);
    return [];
  }
}

// ============================================
// Create Comment
// ============================================

export async function createTrackComment(
  data: CreateTrackCommentRequest
): Promise<TrackComment | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data: comment, error } = await supabase
      .from('track_comments')
      .insert({
        track_id: data.track_id,
        author_id: user.id, // DB column: author_id
        timestamp_ms: data.timestamp_ms,
        content: data.content,
        is_resolved: false,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating comment:', error);
      throw error;
    }

    // Fetch author profile to include username and avatar
    const { data: profile } = await supabase
      .from('profiles')
      .select('username, avatar_url')
      .eq('id', user.id)
      .single();

    return {
      ...comment,
      username: profile?.username || null,
      avatar_url: profile?.avatar_url || null
    };
  } catch (error) {
    console.error('createTrackComment failed:', error);
    return null;
  }
}

// ============================================
// Update Comment
// ============================================

export async function updateTrackComment(
  commentId: string,
  updates: UpdateTrackCommentRequest
): Promise<TrackComment | null> {
  try {
    const { data: comment, error } = await supabase
      .from('track_comments')
      .update(updates)
      .eq('id', commentId)
      .select()
      .single();

    if (error) {
      console.error('Error updating comment:', error);
      throw error;
    }

    return comment;
  } catch (error) {
    console.error('updateTrackComment failed:', error);
    return null;
  }
}

// ============================================
// Delete Comment
// ============================================

export async function deleteTrackComment(commentId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('track_comments')
      .delete()
      .eq('id', commentId);

    if (error) {
      console.error('Error deleting comment:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('deleteTrackComment failed:', error);
    return false;
  }
}

// ============================================
// Toggle Resolved Status
// ============================================

export async function toggleCommentResolved(commentId: string): Promise<TrackComment | null> {
  try {
    // First get current status
    const { data: current } = await supabase
      .from('track_comments')
      .select('is_resolved')
      .eq('id', commentId)
      .single();

    if (!current) {
      throw new Error('Comment not found');
    }

    // Toggle it
    return updateTrackComment(commentId, {
      is_resolved: !current.is_resolved,
    });
  } catch (error) {
    console.error('toggleCommentResolved failed:', error);
    return null;
  }
}

// ============================================
// Subscribe to Comments (Realtime)
// ============================================

export function subscribeToTrackComments(
  trackId: string,
  callback: (comments: TrackComment[]) => void
) {
  const channel = supabase
    .channel(`track-comments:${trackId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'track_comments',
        filter: `track_id=eq.${trackId}`,
      },
      async () => {
        // Refetch all comments when any change occurs
        const comments = await getTrackComments(trackId);
        callback(comments);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
