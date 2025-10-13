// ============================================================================
// ISSUE CARD COMPONENT - Enhanced with Assignment, Labels, PR, Comments
// ============================================================================

import type { IssueWithDetails } from '../../lib/services/issues';

// Priority configuration
const priorityConfig: Record<string, { emoji: string; color: string; label: string }> = {
  critical: { emoji: '🚨', color: '#dc2626', label: 'Critical' },
  high: { emoji: '🔴', color: '#ea580c', label: 'High' },
  medium: { emoji: '🟡', color: '#ca8a04', label: 'Medium' },
  low: { emoji: '🟢', color: '#16a34a', label: 'Low' },
};

// Status configuration (NEW: in_progress instead of in-progress)
const statusConfig: Record<string, { icon: string; color: string; label: string; bg: string }> = {
  open: { icon: '🔵', color: '#2563eb', label: 'Open', bg: '#dbeafe' },
  in_progress: { icon: '🟡', color: '#ca8a04', label: 'In Progress', bg: '#fef3c7' },
  done: { icon: '✅', color: '#16a34a', label: 'Done', bg: '#dcfce7' },
  closed: { icon: '⚪', color: '#6b7280', label: 'Closed', bg: '#f3f4f6' },
};

interface IssueCardProps {
  issue: IssueWithDetails;
  isSelected?: boolean;
  onToggleSelect?: (issueId: string) => void;
  onPriorityChange: (issueId: string, priority: string) => void;
  onStatusProgress: (issueId: string, newStatus: string) => void;
  onCopy: (issue: IssueWithDetails) => void;
  onEdit: (issue: IssueWithDetails) => void;
  onDelete: (issue: IssueWithDetails) => void;
  onAssign?: (issue: IssueWithDetails) => void;
  onViewComments?: (issue: IssueWithDetails) => void;
  formatDate: (dateString: string) => string;
  currentUserId: string | undefined;
  isAdmin: boolean | undefined;
}

export default function IssueCard({
  issue,
  isSelected = false,
  onToggleSelect,
  onPriorityChange,
  onStatusProgress,
  onCopy,
  onEdit,
  onDelete,
  onAssign,
  onViewComments,
  formatDate,
  currentUserId,
  isAdmin = false,
}: IssueCardProps) {
  // NEW LOCK LOGIC: Issue is locked if in_progress AND assigned to someone else
  const isLockedForCurrentUser =
    issue.status === 'in_progress' &&
    issue.assigned_to_id &&
    issue.assigned_to_id !== currentUserId &&
    !isAdmin;

  const hasPR = !!issue.metadata?.pr_url;
  const hasComments = issue.comments_count > 0;

  return (
    <div className={`issue-card ${isSelected ? 'issue-card--selected' : ''} ${isLockedForCurrentUser ? 'issue-card--locked' : ''}`}>
      {/* Checkbox for Bulk Selection */}
      {onToggleSelect && (
        <div className="issue-card__checkbox">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelect(issue.id)}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Action Buttons */}
      <div className="issue-card__actions">
        {/* Quick Action Button - Smart Status Progression */}
        {issue.status === 'open' && (
          <button
            onClick={() => onStatusProgress(issue.id, 'in_progress')}
            className="issue-card__action-btn issue-card__action-btn--progress"
            title="In Bearbeitung"
          >
            ▶️
          </button>
        )}
        {issue.status === 'in_progress' && (
          <button
            onClick={() => onStatusProgress(issue.id, 'done')}
            className="issue-card__action-btn issue-card__action-btn--done"
            title="Als erledigt markieren"
          >
            ✅
          </button>
        )}

        {/* Assignment Button */}
        {onAssign && (
          <button
            onClick={() => onAssign(issue)}
            className={`issue-card__action-btn issue-card__action-btn--assign ${isLockedForCurrentUser ? 'locked' : ''}`}
            title={isLockedForCurrentUser ? `Zugewiesen an: ${issue.assigned_to_username}` : 'Issue zuweisen'}
          >
            {isLockedForCurrentUser ? '🔒' : '👤'}
          </button>
        )}

        {/* Comments Button */}
        {onViewComments && (
          <button
            onClick={() => onViewComments(issue)}
            className={`issue-card__action-btn issue-card__action-btn--comments ${hasComments ? 'has-comments' : ''}`}
            title="Kommentare anzeigen"
          >
            💬 {hasComments && <span className="comment-badge">{issue.comments_count}</span>}
          </button>
        )}

        <button
          onClick={() => onCopy(issue)}
          className="issue-card__action-btn issue-card__action-btn--copy"
          title="Issue kopieren"
        >
          📋
        </button>
        <button
          onClick={() => onEdit(issue)}
          className="issue-card__action-btn issue-card__action-btn--edit"
          title="Bearbeiten"
        >
          ✏️
        </button>
        <button
          onClick={() => onDelete(issue)}
          className="issue-card__action-btn issue-card__action-btn--delete"
          title="Löschen"
        >
          🗑️
        </button>
      </div>

      <div className="issue-card__badges">
        <select
          value={issue.priority}
          onChange={(e) => onPriorityChange(issue.id, e.target.value)}
          className="issue-card__priority-select"
          style={{
            background: priorityConfig[issue.priority].color + '20',
            color: priorityConfig[issue.priority].color,
            borderColor: priorityConfig[issue.priority].color + '40',
          }}
          title="Priorität ändern"
        >
          <option value="low">🟢 Low</option>
          <option value="medium">🟡 Medium</option>
          <option value="high">🔴 High</option>
          <option value="critical">🚨 Critical</option>
        </select>

        <span
          className={`issue-card__badge issue-card__badge--${issue.status}`}
          style={{
            background: statusConfig[issue.status]?.bg || '#f3f4f6',
            color: statusConfig[issue.status]?.color || '#6b7280',
            borderColor: (statusConfig[issue.status]?.color || '#6b7280') + '40'
          }}
        >
          <span>{statusConfig[issue.status]?.icon || '⚪'}</span>
          <span>{statusConfig[issue.status]?.label || issue.status}</span>
        </span>

        {issue.category && (
          <span className="issue-card__badge issue-card__badge--category">
            📁 {issue.category}
          </span>
        )}

        {/* Labels */}
        {issue.labels && issue.labels.length > 0 && (
          <div className="issue-card__labels">
            {issue.labels.slice(0, 3).map((label, idx) => (
              <span key={idx} className="issue-card__label">
                🏷️ {label}
              </span>
            ))}
            {issue.labels.length > 3 && (
              <span className="issue-card__label issue-card__label--more">
                +{issue.labels.length - 3}
              </span>
            )}
          </div>
        )}

        {/* PR Link */}
        {hasPR && (
          <a
            href={issue.metadata.pr_url as string}
            target="_blank"
            rel="noopener noreferrer"
            className="issue-card__badge issue-card__badge--pr"
            title="Linked Pull Request"
          >
            🔗 PR
          </a>
        )}
      </div>

      <h3 className="issue-card__title">
        {issue.title}
        {isLockedForCurrentUser && (
          <span className="issue-card__lock-indicator" title={`🔒 ${issue.assigned_to_username}`}>
            🔒
          </span>
        )}
      </h3>

      {issue.description && (
        <p className="issue-card__description">
          {issue.description}
        </p>
      )}

      <div className="issue-card__footer">
        <div className="issue-card__meta">
          <span title={`Erstellt von: ${issue.created_by_username || issue.created_by_email}`}>
            👤 {issue.created_by_username || issue.created_by_email?.split('@')[0]}
          </span>
          <span>📅 {formatDate(issue.created_at)}</span>
          {issue.updated_at !== issue.created_at && (
            <span>🔄 {formatDate(issue.updated_at)}</span>
          )}
        </div>

        {/* Assignee Info */}
        {isLockedForCurrentUser && (
          <div className="issue-card__assignee">
            🔒 Assigned to: <strong>{issue.assigned_to_username || 'Unknown'}</strong>
          </div>
        )}
      </div>
    </div>
  );
}
