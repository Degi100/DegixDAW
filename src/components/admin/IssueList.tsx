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
      <div style={{
        textAlign: 'center',
        padding: '60px 20px',
        background: 'white',
        borderRadius: '12px',
        border: '2px dashed #d1d5db'
      }}>
        <div style={{ fontSize: '64px', marginBottom: '16px' }}>
          {hasFilters ? '🔍' : '📦'}
        </div>
        <p style={{ fontSize: '16px', color: '#6b7280' }}>
          {hasFilters 
            ? 'Keine Issues gefunden mit diesen Filtern.'
            : 'Keine Issues vorhanden.'}
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
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
