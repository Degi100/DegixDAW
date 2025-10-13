// ============================================================================
// COMMENTS SERVICE - SUPABASE INTEGRATION
// ============================================================================

import { supabase } from '../../supabase';
import type {
  IssueComment,
  IssueCommentWithUser,
  CreateCommentRequest,
} from './types';

// ============================================================================
// CRUD OPERATIONS
// ============================================================================

/**
 * Fetch all comments for an issue with user details
 */
export async function getIssueComments(
  issueId: string
): Promise<{ data: IssueCommentWithUser[] | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('issue_comments')
      .select(
        `
        *,
        user:profiles!user_id (
          username,
          id
        )
      `
      )
      .eq('issue_id', issueId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Transform data to match IssueCommentWithUser interface
    const commentsWithUser = data?.map((comment: any) => ({
      ...comment,
      user_username: comment.user?.username || null,
      user_email: '', // Email not available in profiles, only in auth.users
    }));

    return { data: commentsWithUser, error: null };
  } catch (err) {
    console.error('[CommentsService] Error fetching comments:', err);
    return { data: null, error: err as Error };
  }
}

/**
 * Create a new comment
 */
export async function createComment(
  request: CreateCommentRequest
): Promise<{ data: IssueComment | null; error: Error | null }> {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('issue_comments')
      .insert({
        ...request,
        user_id: user.user.id,
        metadata: request.metadata || {},
      })
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (err) {
    console.error('[CommentsService] Error creating comment:', err);
    return { data: null, error: err as Error };
  }
}

/**
 * Delete a comment (only own comments, or admin can delete any)
 */
export async function deleteComment(
  commentId: string
): Promise<{ success: boolean; error: Error | null }> {
  try {
    const { error } = await supabase
      .from('issue_comments')
      .delete()
      .eq('id', commentId);

    if (error) throw error;

    return { success: true, error: null };
  } catch (err) {
    console.error('[CommentsService] Error deleting comment:', err);
    return { success: false, error: err as Error };
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Create a status change comment automatically
 */
export async function createStatusChangeComment(
  issueId: string,
  oldStatus: string,
  newStatus: string,
  reason?: string
): Promise<{ data: IssueComment | null; error: Error | null }> {
  const comment = reason || `Status changed from ${oldStatus} to ${newStatus}`;

  return createComment({
    issue_id: issueId,
    comment,
    action_type: 'status_change',
    metadata: {
      old_status: oldStatus as any,
      new_status: newStatus as any,
    },
  });
}

/**
 * Create an assignment change comment automatically
 */
export async function createAssignmentComment(
  issueId: string,
  oldAssignee: string | null,
  newAssignee: string | null,
  comment?: string
): Promise<{ data: IssueComment | null; error: Error | null }> {
  const defaultComment = newAssignee
    ? oldAssignee
      ? 'Reassigned issue'
      : 'Assigned issue'
    : 'Unassigned issue';

  return createComment({
    issue_id: issueId,
    comment: comment || defaultComment,
    action_type: 'assignment',
    metadata: {
      ...(oldAssignee && { old_assignee: oldAssignee }),
      ...(newAssignee && { new_assignee: newAssignee }),
    },
  });
}

// ============================================================================
// REALTIME SUBSCRIPTIONS
// ============================================================================

/**
 * Subscribe to comments for a specific issue
 */
export function subscribeToIssueComments(
  issueId: string,
  callback: (payload: {
    eventType: string;
    new: IssueComment;
    old: IssueComment;
  }) => void
) {
  const subscription = supabase
    .channel(`issue-comments-${issueId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'issue_comments',
        filter: `issue_id=eq.${issueId}`,
      },
      (payload) => {
        console.log('[CommentsService] Realtime comment update:', payload);
        callback(payload as any);
      }
    )
    .subscribe();

  return subscription;
}

/**
 * Unsubscribe from issue comments
 */
export async function unsubscribeFromIssueComments(subscription: any) {
  await supabase.removeChannel(subscription);
}
