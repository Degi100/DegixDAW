// src/components/admin/IssueFilters.tsx
// Filter controls for Issue Management

interface IssueFiltersProps {
  searchTerm: string;
  statusFilter: string;
  priorityFilter: string;
  sortBy: string;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onPriorityChange: (value: string) => void;
  onSortChange: (value: string) => void;
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
  onSearchChange,
  onStatusChange,
  onPriorityChange,
  onSortChange,
  stats,
}: IssueFiltersProps) {
  return (
    <div style={{ 
      display: 'flex', 
      gap: '12px', 
      marginBottom: '24px', 
      flexWrap: 'wrap',
      background: 'white',
      padding: '16px',
      borderRadius: '12px',
      border: '1px solid #e5e7eb'
    }}>
      <div style={{ position: 'relative', flex: '1', minWidth: '200px' }}>
        <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '16px' }}>🔍</span>
        <input 
          type="text" 
          placeholder="Search issues..." 
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 12px 10px 36px',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            fontSize: '14px',
            outline: 'none',
          }}
        />
      </div>
      <select 
        value={statusFilter}
        onChange={(e) => onStatusChange(e.target.value)}
        style={{
          padding: '10px 36px 10px 12px',
          border: '1px solid #d1d5db',
          borderRadius: '8px',
          fontSize: '14px',
          background: 'white',
          cursor: 'pointer',
          minWidth: '150px',
          color: '#000000'
        }}
      >
        <option value="all" style={{ color: '#000000' }}>📊 Alle Status</option>
        <option value="open" style={{ color: '#000000' }}>🔵 Open ({stats.open})</option>
        <option value="in-progress" style={{ color: '#000000' }}>🟡 In Progress ({stats.inProgress})</option>
        <option value="done" style={{ color: '#000000' }}>✅ Done ({stats.done})</option>
        <option value="closed" style={{ color: '#000000' }}>⚪ Closed ({stats.closed})</option>
      </select>
      <select 
        value={priorityFilter}
        onChange={(e) => onPriorityChange(e.target.value)}
        style={{
          padding: '10px 36px 10px 12px',
          border: '1px solid #d1d5db',
          borderRadius: '8px',
          fontSize: '14px',
          background: 'white',
          cursor: 'pointer',
          minWidth: '150px',
          color: '#000000'
        }}
      >
        <option value="all" style={{ color: '#000000' }}>⚡ Alle Prioritäten</option>
        <option value="critical" style={{ color: '#000000' }}>🚨 Critical</option>
        <option value="high" style={{ color: '#000000' }}>🔴 High ({stats.highPriority})</option>
        <option value="medium" style={{ color: '#000000' }}>🟡 Medium</option>
        <option value="low" style={{ color: '#000000' }}>🟢 Low</option>
      </select>
      <select 
        value={sortBy}
        onChange={(e) => onSortChange(e.target.value)}
        style={{
          padding: '10px 36px 10px 12px',
          border: '1px solid #d1d5db',
          borderRadius: '8px',
          fontSize: '14px',
          background: 'white',
          cursor: 'pointer',
          minWidth: '200px',
          color: '#000000'
        }}
      >
        <option value="date-desc" style={{ color: '#000000' }}>📅 Neueste zuerst</option>
        <option value="date-asc" style={{ color: '#000000' }}>📅 Älteste zuerst</option>
        <option value="priority-desc" style={{ color: '#000000' }}>🚨 Priorität: Hoch → Niedrig</option>
        <option value="priority-asc" style={{ color: '#000000' }}>🟢 Priorität: Niedrig → Hoch</option>
        <option value="status" style={{ color: '#000000' }}>📊 Status: Open → Done</option>
        <option value="title-asc" style={{ color: '#000000' }}>🔤 Titel: A → Z</option>
        <option value="title-desc" style={{ color: '#000000' }}>🔤 Titel: Z → A</option>
      </select>
    </div>
  );
}
