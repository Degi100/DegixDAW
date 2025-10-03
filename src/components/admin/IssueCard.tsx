// src/components/admin/IssueCard.tsx
// Individual issue card with inline actions

import type { Issue } from '../../hooks/useIssues';

// Priority configuration  
const priorityConfig: Record<Issue['priority'], { emoji: string; color: string; label: string }> = {
  critical: { emoji: '🚨', color: '#dc2626', label: 'Critical' },
  high: { emoji: '🔴', color: '#ea580c', label: 'High' },
  medium: { emoji: '🟡', color: '#ca8a04', label: 'Medium' },
  low: { emoji: '🟢', color: '#16a34a', label: 'Low' },
};

// Status configuration
const statusConfig: Record<Issue['status'], { icon: string; color: string; label: string; bg: string }> = {
  open: { icon: '🔵', color: '#2563eb', label: 'Open', bg: '#dbeafe' },
  'in-progress': { icon: '🟡', color: '#ca8a04', label: 'In Progress', bg: '#fef3c7' },
  done: { icon: '✅', color: '#16a34a', label: 'Done', bg: '#dcfce7' },
  closed: { icon: '⚪', color: '#6b7280', label: 'Closed', bg: '#f3f4f6' },
};

interface IssueCardProps {
  issue: Issue;
  onPriorityChange: (issueId: string, priority: Issue['priority']) => void;
  onStatusProgress: (issueId: string, newStatus: Issue['status']) => void;
  onCopy: (issue: Issue) => void;
  onEdit: (issue: Issue) => void;
  onDelete: (issue: Issue) => void;
  formatDate: (dateString: string) => string;
}

export default function IssueCard({
  issue,
  onPriorityChange,
  onStatusProgress,
  onCopy,
  onEdit,
  onDelete,
  formatDate,
}: IssueCardProps) {
  return (
    <div className="issue-card">
      {/* Action Buttons */}
      <div className="issue-card__actions">
        {/* Quick Action Button - Smart Status Progression */}
        {issue.status === 'open' && (
          <button
            onClick={() => onStatusProgress(issue.id, 'in-progress')}
            className="issue-card__action-btn issue-card__action-btn--progress"
            title="In Bearbeitung"
          >
            ▶️
          </button>
        )}
        {issue.status === 'in-progress' && (
          <button
            onClick={() => onStatusProgress(issue.id, 'done')}
            className="issue-card__action-btn issue-card__action-btn--done"
            title="Als erledigt markieren"
          >
            ✅
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
          onChange={(e) => onPriorityChange(issue.id, e.target.value as Issue['priority'])}
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
          className="issue-card__badge"
          style={{
            background: statusConfig[issue.status].bg,
            color: statusConfig[issue.status].color,
            borderColor: statusConfig[issue.status].color + '40'
          }}
        >
          <span>{statusConfig[issue.status].icon}</span>
          <span>{statusConfig[issue.status].label}</span>
        </span>
        {issue.category && (
          <span className="issue-card__badge issue-card__badge--category">
            📁 {issue.category}
          </span>
        )}
      </div>
      <h3 className="issue-card__title">
        {issue.title}
      </h3>
      {issue.description && (
        <p className="issue-card__description">
          {issue.description}
        </p>
      )}
      <div className="issue-card__footer">
        <span>📅 Erstellt: {formatDate(issue.created_at)}</span>
        {issue.updated_at !== issue.created_at && (
          <span>🔄 Aktualisiert: {formatDate(issue.updated_at)}</span>
        )}
      </div>
    </div>
  );
}
