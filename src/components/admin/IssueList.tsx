// src/components/admin/IssueList.tsx
// List container for issues with empty state

import type { Issue } from '../../hooks/useIssues';
import IssueCard from './IssueCard';

interface IssueListProps {
  issues: Issue[];
  searchTerm: string;
  statusFilter: string;
  priorityFilter: string;
  selectedIssueIds?: string[];
  onToggleSelect?: (issueId: string) => void;
  onSelectAll?: () => void;
  onPriorityChange: (issueId: string, priority: Issue['priority']) => void;
  onStatusProgress: (issueId: string, newStatus: Issue['status']) => void;
  onCopy: (issue: Issue) => void;
  onEdit: (issue: Issue) => void;
  onDelete: (issue: Issue) => void;
  formatDate: (dateString: string) => string;
  onExport?: () => void;
  onSaveMarkdown?: () => void;
  onRefresh?: () => void;
  onCreateNew?: () => void;
}

export default function IssueList({
  issues,
  searchTerm,
  statusFilter,
  priorityFilter,
  selectedIssueIds = [],
  onToggleSelect,
  onSelectAll,
  onPriorityChange,
  onStatusProgress,
  onCopy,
  onEdit,
  onDelete,
  formatDate,
  onExport,
  onSaveMarkdown,
  onRefresh,
  onCreateNew,
}: IssueListProps) {
  const hasFilters = searchTerm || statusFilter !== 'all' || priorityFilter !== 'all';

  if (issues.length === 0) {
    return (
      <div className="issue-list issue-list--empty">
        <div className="issue-list__empty-icon">
          {hasFilters ? '🔍' : '📦'}
        </div>
        <p className="issue-list__empty-text">
          {hasFilters 
            ? 'Keine Issues gefunden mit diesen Filtern.'
            : 'Keine Issues vorhanden.'}
        </p>
      </div>
    );
  }

  const isBulkMode = onToggleSelect && onSelectAll;
  const allSelected = selectedIssueIds.length === issues.length && issues.length > 0;

  return (
    <div className="issue-list">
      {/* Select All Header */}
      {isBulkMode && (
        <div className="issue-list__bulk-header">
          <label className="issue-list__checkbox-label">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={onSelectAll}
              className="issue-list__checkbox"
            />
            <span>Alle auswählen ({issues.length})</span>
          </label>
          <div className="issue-list__bulk-actions">
            {onExport && (
              <button onClick={onExport} className="issue-list__action-btn">
                📦 JSON
              </button>
            )}
            {onSaveMarkdown && (
              <button onClick={onSaveMarkdown} className="issue-list__action-btn">
                📝 MD
              </button>
            )}
            {onRefresh && (
              <button onClick={onRefresh} className="issue-list__action-btn">
                🔄 Refresh
              </button>
            )}
            {onCreateNew && (
              <button onClick={onCreateNew} className="issue-list__action-btn issue-list__action-btn--primary">
                ➕ New Issue
              </button>
            )}
          </div>
        </div>
      )}

      {issues.map((issue) => (
        <IssueCard
          key={issue.id}
          issue={issue}
          isSelected={selectedIssueIds.includes(issue.id)}
          onToggleSelect={onToggleSelect}
          onPriorityChange={onPriorityChange}
          onStatusProgress={onStatusProgress}
          onCopy={onCopy}
          onEdit={onEdit}
          onDelete={onDelete}
          formatDate={formatDate}
        />
      ))}
    </div>
  );
}
