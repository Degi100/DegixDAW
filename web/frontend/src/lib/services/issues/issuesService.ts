// ============================================================================
// ISSUES SERVICE - SUPABASE INTEGRATION
// ============================================================================

import { supabase } from '../../supabase';
import type {
  Issue,
  IssueWithDetails,
  CreateIssueRequest,
  UpdateIssueRequest,
  AssignIssueResponse,
} from './types';

// ============================================================================
// CRUD OPERATIONS
// ============================================================================

/**
 * Fetch all issues with user details via RPC function
 */
export async function getAllIssuesWithDetails(): Promise<{
  data: IssueWithDetails[] | null;
  error: Error | null;
}> {
  try {
    const { data, error } = await supabase.rpc('get_issues_with_details');

    if (error) throw error;

    return { data, error: null };
  } catch (err) {
    console.error('[IssuesService] Error fetching issues:', err);
    return { data: null, error: err as Error };
  }
}

/**
 * Create a new issue
 */
export async function createIssue(
  request: CreateIssueRequest
): Promise<{ data: Issue | null; error: Error | null }> {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('issues')
      .insert({
        ...request,
        created_by: user.user.id,
        labels: request.labels || [],
      })
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (err) {
    console.error('[IssuesService] Error creating issue:', err);
    return { data: null, error: err as Error };
  }
}

/**
 * Update an existing issue
 */
export async function updateIssue(
  issueId: string,
  updates: UpdateIssueRequest
): Promise<{ data: Issue | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('issues')
      .update(updates)
      .eq('id', issueId)
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (err) {
    console.error('[IssuesService] Error updating issue:', err);
    return { data: null, error: err as Error };
  }
}

/**
 * Delete an issue
 */
export async function deleteIssue(
  issueId: string
): Promise<{ success: boolean; error: Error | null }> {
  try {
    const { error } = await supabase.from('issues').delete().eq('id', issueId);

    if (error) throw error;

    return { success: true, error: null };
  } catch (err) {
    console.error('[IssuesService] Error deleting issue:', err);
    return { success: false, error: err as Error };
  }
}

// ============================================================================
// ASSIGNMENT OPERATIONS
// ============================================================================

/**
 * Assign issue to user (with lock check via RPC)
 */
export async function assignIssue(
  issueId: string,
  userId: string | null
): Promise<{ data: AssignIssueResponse | null; error: Error | null }> {
  try {
    // If unassigning (userId = null), use direct update
    if (userId === null) {
      const { error } = await supabase
        .from('issues')
        .update({ assigned_to: null })
        .eq('id', issueId);

      if (error) throw error;

      return {
        data: { success: true },
        error: null,
      };
    }

    // Use RPC for assignment (includes lock check)
    const { data, error } = await supabase.rpc('assign_issue', {
      issue_id: issueId,
      user_id: userId,
    });

    if (error) throw error;

    return { data, error: null };
  } catch (err) {
    console.error('[IssuesService] Error assigning issue:', err);
    return { data: null, error: err as Error };
  }
}

// ============================================================================
// BULK OPERATIONS
// ============================================================================

/**
 * Bulk update issue status
 */
export async function bulkUpdateStatus(
  issueIds: string[],
  status: Issue['status']
): Promise<{ success: boolean; error: Error | null }> {
  try {
    const { error } = await supabase
      .from('issues')
      .update({ status })
      .in('id', issueIds);

    if (error) throw error;

    return { success: true, error: null };
  } catch (err) {
    console.error('[IssuesService] Error bulk updating status:', err);
    return { success: false, error: err as Error };
  }
}

/**
 * Bulk update issue priority
 */
export async function bulkUpdatePriority(
  issueIds: string[],
  priority: Issue['priority']
): Promise<{ success: boolean; error: Error | null }> {
  try {
    const { error } = await supabase
      .from('issues')
      .update({ priority })
      .in('id', issueIds);

    if (error) throw error;

    return { success: true, error: null };
  } catch (err) {
    console.error('[IssuesService] Error bulk updating priority:', err);
    return { success: false, error: err as Error };
  }
}

/**
 * Bulk delete issues
 */
export async function bulkDeleteIssues(
  issueIds: string[]
): Promise<{ success: boolean; error: Error | null }> {
  try {
    const { error } = await supabase.from('issues').delete().in('id', issueIds);

    if (error) throw error;

    return { success: true, error: null };
  } catch (err) {
    console.error('[IssuesService] Error bulk deleting issues:', err);
    return { success: false, error: err as Error };
  }
}

// ============================================================================
// REALTIME SUBSCRIPTIONS
// ============================================================================

/**
 * Subscribe to issues table changes
 */
export function subscribeToIssues(
  callback: (payload: { eventType: string; new: Issue; old: Issue }) => void
) {
  const subscription = supabase
    .channel('issues-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'issues',
      },
      (payload) => {
        console.log('[IssuesService] Realtime update:', payload);
        callback(payload as any);
      }
    )
    .subscribe((status) => {
      console.log('[IssuesService] Subscription status:', status);
    });

  return subscription;
}

/**
 * Unsubscribe from issues table
 */
export async function unsubscribeFromIssues(subscription: any) {
  await supabase.removeChannel(subscription);
}

// ============================================================================
// METADATA OPERATIONS
// ============================================================================

/**
 * Update issue metadata (e.g., PR URL)
 */
export async function updateIssueMetadata(
  issueId: string,
  metadata: Record<string, unknown>
): Promise<{ success: boolean; error: Error | null }> {
  try {
    const { data: issue, error: fetchError } = await supabase
      .from('issues')
      .select('metadata')
      .eq('id', issueId)
      .single();

    if (fetchError) throw fetchError;

    const updatedMetadata = {
      ...(issue.metadata || {}),
      ...metadata,
    };

    const { error: updateError } = await supabase
      .from('issues')
      .update({ metadata: updatedMetadata })
      .eq('id', issueId);

    if (updateError) throw updateError;

    return { success: true, error: null };
  } catch (err) {
    console.error('[IssuesService] Error updating metadata:', err);
    return { success: false, error: err as Error };
  }
}
