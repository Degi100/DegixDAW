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
