// ============================================================================
// ISSUE FILTERS - Updated for new IssueStats type
// ============================================================================

import type { IssueStats } from '../../lib/services/issues';

interface IssueFiltersProps {
  searchTerm: string;
  statusFilter: string;
  priorityFilter: string;
  sortBy: string;
  showCompleted: boolean;
  completedCount: number;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onPriorityChange: (value: string) => void;
  onSortChange: (value: string) => void;
  onShowCompletedToggle: () => void;
  stats: IssueStats;
}

export default function IssueFilters({
  searchTerm,
  statusFilter,
  priorityFilter,
  sortBy,
  showCompleted,
  completedCount,
  onSearchChange,
  onStatusChange,
  onPriorityChange,
  onSortChange,
  onShowCompletedToggle,
  stats,
}: IssueFiltersProps) {
  return (
    <div className="issue-filters">
      <div className="issue-filters__search">
        <span className="issue-filters__search-icon">🔍</span>
        <input
          type="text"
          placeholder="Search issues..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="issue-filters__search-input"
        />
      </div>
      <select
        value={statusFilter}
        onChange={(e) => onStatusChange(e.target.value)}
        className="issue-filters__select"
      >
        <option value="all">📊 Alle Status</option>
        <option value="open">🔵 Open ({stats.open})</option>
        <option value="in_progress">🟡 In Progress ({stats.in_progress})</option>
        <option value="done">✅ Done ({stats.done})</option>
        <option value="closed">⚪ Closed ({stats.closed})</option>
      </select>
      <select
        value={priorityFilter}
        onChange={(e) => onPriorityChange(e.target.value)}
        className="issue-filters__select"
      >
        <option value="all">⚡ Alle Prioritäten</option>
        <option value="critical">🚨 Critical ({stats.by_priority.critical})</option>
        <option value="high">🔴 High ({stats.by_priority.high})</option>
        <option value="medium">🟡 Medium ({stats.by_priority.medium})</option>
        <option value="low">🟢 Low ({stats.by_priority.low})</option>
      </select>
      <select
        value={sortBy}
        onChange={(e) => onSortChange(e.target.value)}
        className="issue-filters__select"
      >
        <option value="date-desc">📅 Neueste zuerst</option>
        <option value="date-asc">📅 Älteste zuerst</option>
        <option value="priority-desc">⚡ Höchste Priorität</option>
        <option value="priority-asc">⚡ Niedrigste Priorität</option>
        <option value="title-asc">🔤 A-Z</option>
        <option value="title-desc">🔤 Z-A</option>
      </select>
      <label className="issue-filters__toggle">
        <input
          type="checkbox"
          checked={showCompleted}
          onChange={onShowCompletedToggle}
        />
        <span>Erledigte anzeigen ({completedCount})</span>
      </label>
    </div>
  );
}
