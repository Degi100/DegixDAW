// src/components/admin/IssueList.tsx
// List container for issues with empty state

import type { Issue } from '../../hooks/useIssues';
import IssueCard from './IssueCard';

interface IssueListProps {
  issues: Issue[];
  searchTerm: string;
  statusFilter: string;
  priorityFilter: string;
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

  return (
    <div className="issue-list">
      {issues.map((issue) => (
        <IssueCard
          key={issue.id}
          issue={issue}
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
