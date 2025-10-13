// ============================================================================
// ISSUES SERVICE - HELPER FUNCTIONS
// ============================================================================

import type {
  Issue,
  IssueWithDetails,
  IssueFilters,
  IssueSortConfig,
  IssueStats,
  IssuePriority,
  IssueStatus,
} from './types';

// ============================================================================
// FILTERING & SORTING
// ============================================================================

/**
 * Filter issues based on criteria
 */
export function filterIssues(
  issues: IssueWithDetails[],
  filters: IssueFilters
): IssueWithDetails[] {
  return issues.filter((issue) => {
    // Status filter
    if (filters.status && filters.status.length > 0) {
      if (!filters.status.includes(issue.status)) return false;
    }

    // Priority filter
    if (filters.priority && filters.priority.length > 0) {
      if (!filters.priority.includes(issue.priority)) return false;
    }

    // Labels filter
    if (filters.labels && filters.labels.length > 0) {
      const hasMatchingLabel = filters.labels.some((label) =>
        issue.labels.includes(label)
      );
      if (!hasMatchingLabel) return false;
    }

    // Assigned to filter
    if (filters.assigned_to) {
      if (issue.assigned_to_id !== filters.assigned_to) return false;
    }

    // Created by filter
    if (filters.created_by) {
      if (issue.created_by_id !== filters.created_by) return false;
    }

    // Search filter (title + description)
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const titleMatch = issue.title.toLowerCase().includes(searchLower);
      const descMatch = issue.description
        ?.toLowerCase()
        .includes(searchLower);
      if (!titleMatch && !descMatch) return false;
    }

    return true;
  });
}

/**
 * Sort issues based on configuration
 */
export function sortIssues(
  issues: IssueWithDetails[],
  sortConfig: IssueSortConfig
): IssueWithDetails[] {
  const sorted = [...issues].sort((a, b) => {
    let comparison = 0;

    switch (sortConfig.field) {
      case 'priority':
        comparison = comparePriority(a.priority, b.priority);
        break;

      case 'status':
        comparison = compareStatus(a.status, b.status);
        break;

      case 'title':
        comparison = a.title.localeCompare(b.title);
        break;

      case 'created_at':
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        break;

      case 'updated_at':
        comparison = new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
        break;
    }

    return sortConfig.direction === 'asc' ? comparison : -comparison;
  });

  return sorted;
}

/**
 * Compare priorities (critical > high > medium > low)
 */
function comparePriority(a: IssuePriority, b: IssuePriority): number {
  const order: Record<IssuePriority, number> = {
    critical: 4,
    high: 3,
    medium: 2,
    low: 1,
  };
  return order[a] - order[b];
}

/**
 * Compare statuses (open > in_progress > done > closed)
 */
function compareStatus(a: IssueStatus, b: IssueStatus): number {
  const order: Record<IssueStatus, number> = {
    open: 4,
    in_progress: 3,
    done: 2,
    closed: 1,
  };
  return order[a] - order[b];
}

// ============================================================================
// STATISTICS
// ============================================================================

/**
 * Calculate issue statistics
 */
export function calculateIssueStats(issues: Issue[]): IssueStats {
  const stats: IssueStats = {
    total: issues.length,
    open: 0,
    in_progress: 0,
    done: 0,
    closed: 0,
    by_priority: {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
    },
    by_label: {},
    assigned: 0,
    unassigned: 0,
  };

  issues.forEach((issue) => {
    // Count by status
    stats[issue.status]++;

    // Count by priority
    stats.by_priority[issue.priority]++;

    // Count by labels
    issue.labels.forEach((label) => {
      stats.by_label[label] = (stats.by_label[label] || 0) + 1;
    });

    // Count assigned/unassigned
    if (issue.assigned_to) {
      stats.assigned++;
    } else {
      stats.unassigned++;
    }
  });

  return stats;
}

// ============================================================================
// FORMATTING
// ============================================================================

/**
 * Get priority emoji
 */
export function getPriorityEmoji(priority: IssuePriority): string {
  const emojis: Record<IssuePriority, string> = {
    critical: '🔴',
    high: '🟠',
    medium: '🟡',
    low: '🟢',
  };
  return emojis[priority];
}

/**
 * Get status emoji
 */
export function getStatusEmoji(status: IssueStatus): string {
  const emojis: Record<IssueStatus, string> = {
    open: '📭',
    in_progress: '🔄',
    done: '✅',
    closed: '🔒',
  };
  return emojis[status];
}

/**
 * Get status color class
 */
export function getStatusColorClass(status: IssueStatus): string {
  const colors: Record<IssueStatus, string> = {
    open: 'status-open',
    in_progress: 'status-in-progress',
    done: 'status-done',
    closed: 'status-closed',
  };
  return colors[status];
}

/**
 * Get priority color class
 */
export function getPriorityColorClass(priority: IssuePriority): string {
  const colors: Record<IssuePriority, string> = {
    critical: 'priority-critical',
    high: 'priority-high',
    medium: 'priority-medium',
    low: 'priority-low',
  };
  return colors[priority];
}

/**
 * Format relative time
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Check if user can edit issue
 */
export function canEditIssue(
  issue: Issue,
  userId: string,
  isAdmin: boolean
): boolean {
  // Admin can edit everything
  if (isAdmin) return true;

  // Creator can edit their own issues
  if (issue.created_by === userId) return true;

  // Assignee can edit assigned issues
  if (issue.assigned_to === userId) return true;

  return false;
}

/**
 * Check if user can delete issue
 */
export function canDeleteIssue(
  issue: Issue,
  userId: string,
  isAdmin: boolean
): boolean {
  // Only admin or creator can delete
  return isAdmin || issue.created_by === userId;
}

/**
 * Check if issue is locked (assigned to someone else)
 */
export function isIssueLocked(
  issue: Issue,
  userId: string,
  isAdmin: boolean
): boolean {
  // Admin can bypass locks
  if (isAdmin) return false;

  // Locked if assigned to someone else
  return !!issue.assigned_to && issue.assigned_to !== userId;
}
