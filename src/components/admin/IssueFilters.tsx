// src/components/admin/IssueFilters.tsx
// Filter controls for Issue Management

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
  stats: {
    open: number;
    inProgress: number;
    done: number;
    closed: number;
    highPriority: number;
  };
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
        <option value="in-progress">🟡 In Progress ({stats.inProgress})</option>
        <option value="done">✅ Done ({stats.done})</option>
        <option value="closed">⚪ Closed ({stats.closed})</option>
      </select>
      <select 
        value={priorityFilter}
        onChange={(e) => onPriorityChange(e.target.value)}
        className="issue-filters__select"
      >
        <option value="all">⚡ Alle Prioritäten</option>
        <option value="critical">🚨 Critical</option>
        <option value="high">🔴 High ({stats.highPriority})</option>
        <option value="medium">🟡 Medium</option>
        <option value="low">🟢 Low</option>
      </select>
      <select 
        value={sortBy}
        onChange={(e) => onSortChange(e.target.value)}
        className="issue-filters__select issue-filters__select--sort"
      >
        <option value="date-desc">📅 Neueste zuerst</option>
        <option value="date-asc">📅 Älteste zuerst</option>
        <option value="priority-desc">🚨 Priorität: Hoch → Niedrig</option>
        <option value="priority-asc">🟢 Priorität: Niedrig → Hoch</option>
        <option value="status">📊 Status: Open → Done</option>
        <option value="title-asc">🔤 Titel: A → Z</option>
        <option value="title-desc">🔤 Titel: Z → A</option>
      </select>
      <button 
        onClick={onShowCompletedToggle}
        className={`issue-filters__toggle ${showCompleted ? 'issue-filters__toggle--active' : ''}`}
        title={showCompleted ? 'Abgeschlossene ausblenden' : 'Abgeschlossene anzeigen'}
      >
        {showCompleted ? '👁️' : '👁️‍🗨️'} 
        {showCompleted ? 'Abgeschlossene ausblenden' : `Abgeschlossene anzeigen (${completedCount})`}
      </button>
    </div>
  );
}
