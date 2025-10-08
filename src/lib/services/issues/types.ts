// ============================================================================
// ISSUES SERVICE - TYPE DEFINITIONS
// ============================================================================

export type IssueStatus = 'open' | 'in_progress' | 'done' | 'closed';
export type IssuePriority = 'low' | 'medium' | 'high' | 'critical';
export type IssueLabel = 'bug' | 'feature' | 'urgent' | 'docs' | 'enhancement' | 'question';
export type CommentActionType = 'comment' | 'status_change' | 'assignment' | 'label_change';

// ============================================================================
// DATABASE MODELS
// ============================================================================

export interface Issue {
  id: string;
  title: string;
  description: string | null;
  status: IssueStatus;
  priority: IssuePriority;
  category: string | null;
  labels: IssueLabel[];
  assigned_to: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  metadata: IssueMetadata;
}

export interface IssueMetadata {
  pr_url?: string;
  github_issue_url?: string;
  [key: string]: unknown;
}

export interface IssueComment {
  id: string;
  issue_id: string;
  user_id: string;
  comment: string;
  created_at: string;
  action_type: CommentActionType | null;
  metadata: CommentMetadata;
}

export interface CommentMetadata {
  old_status?: IssueStatus;
  new_status?: IssueStatus;
  old_assignee?: string;
  new_assignee?: string;
  [key: string]: unknown;
}

// ============================================================================
// EXTENDED MODELS (with relations)
// ============================================================================

export interface IssueWithDetails extends Issue {
  created_by_id: string;
  created_by_username: string | null;
  created_by_email: string;
  assigned_to_id: string | null;
  assigned_to_username: string | null;
  assigned_to_email: string | null;
  comments_count: number;
}

export interface IssueCommentWithUser extends IssueComment {
  user_username: string | null;
  user_email: string;
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

export interface CreateIssueRequest {
  title: string;
  description?: string;
  priority?: IssuePriority;
  category?: string;
  labels?: IssueLabel[];
  assigned_to?: string;
}

export interface UpdateIssueRequest {
  title?: string;
  description?: string;
  status?: IssueStatus;
  priority?: IssuePriority;
  category?: string;
  labels?: IssueLabel[];
  assigned_to?: string;
  metadata?: Partial<IssueMetadata>;
}

export interface CreateCommentRequest {
  issue_id: string;
  comment: string;
  action_type?: CommentActionType;
  metadata?: CommentMetadata;
}

export interface AssignIssueResponse {
  success: boolean;
  error?: string;
  assigned_to?: string;
}

// ============================================================================
// UI STATE TYPES
// ============================================================================

export interface IssueFilters {
  status?: IssueStatus[];
  priority?: IssuePriority[];
  labels?: IssueLabel[];
  assigned_to?: string;
  created_by?: string;
  search?: string;
}

export interface IssueSortConfig {
  field: 'created_at' | 'updated_at' | 'priority' | 'status' | 'title';
  direction: 'asc' | 'desc';
}

// ============================================================================
// STATISTICS
// ============================================================================

export interface IssueStats {
  total: number;
  open: number;
  in_progress: number;
  done: number;
  closed: number;
  by_priority: Record<IssuePriority, number>;
  by_label: Record<string, number>;
  assigned: number;
  unassigned: number;
}
