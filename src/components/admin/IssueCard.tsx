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
    <div 
      style={{
        background: 'white',
        padding: '20px',
        borderRadius: '12px',
        border: '1px solid #e5e7eb',
        transition: 'all 0.2s',
        position: 'relative',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {/* Action Buttons */}
      <div style={{ position: 'absolute', top: '16px', right: '16px', display: 'flex', gap: '8px' }}>
        {/* Quick Action Button - Smart Status Progression */}
        {issue.status === 'open' && (
          <button
            onClick={() => onStatusProgress(issue.id, 'in-progress')}
            style={{
              padding: '6px 12px',
              border: '1px solid #fcd34d',
              borderRadius: '6px',
              background: '#fef3c7',
              cursor: 'pointer',
              fontSize: '14px',
            }}
            title="In Bearbeitung"
          >
            ▶️
          </button>
        )}
        {issue.status === 'in-progress' && (
          <button
            onClick={() => onStatusProgress(issue.id, 'done')}
            style={{
              padding: '6px 12px',
              border: '1px solid #86efac',
              borderRadius: '6px',
              background: '#dcfce7',
              cursor: 'pointer',
              fontSize: '14px',
            }}
            title="Als erledigt markieren"
          >
            ✅
          </button>
        )}
        <button
          onClick={() => onCopy(issue)}
          style={{
            padding: '6px 12px',
            border: '1px solid #93c5fd',
            borderRadius: '6px',
            background: '#dbeafe',
            cursor: 'pointer',
            fontSize: '14px',
          }}
          title="Issue kopieren"
        >
          📋
        </button>
        <button
          onClick={() => onEdit(issue)}
          style={{
            padding: '6px 12px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            background: 'white',
            cursor: 'pointer',
            fontSize: '14px',
          }}
          title="Bearbeiten"
        >
          ✏️
        </button>
        <button
          onClick={() => onDelete(issue)}
          style={{
            padding: '6px 12px',
            border: '1px solid #fca5a5',
            borderRadius: '6px',
            background: '#fef2f2',
            cursor: 'pointer',
            fontSize: '14px',
          }}
          title="Löschen"
        >
          🗑️
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px', paddingRight: '200px' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <select
            value={issue.priority}
            onChange={(e) => onPriorityChange(issue.id, e.target.value as Issue['priority'])}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: '600',
              background: priorityConfig[issue.priority].color + '20',
              color: priorityConfig[issue.priority].color,
              border: `1px solid ${priorityConfig[issue.priority].color}40`,
              cursor: 'pointer',
              outline: 'none'
            }}
            title="Priorität ändern"
          >
            <option value="low">🟢 Low</option>
            <option value="medium">🟡 Medium</option>
            <option value="high">🔴 High</option>
            <option value="critical">🚨 Critical</option>
          </select>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 12px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: '600',
            background: statusConfig[issue.status].bg,
            color: statusConfig[issue.status].color,
            border: `1px solid ${statusConfig[issue.status].color}40`
          }}>
            <span>{statusConfig[issue.status].icon}</span>
            <span>{statusConfig[issue.status].label}</span>
          </span>
          {issue.category && (
            <span style={{
              padding: '4px 12px',
              borderRadius: '20px',
              fontSize: '12px',
              background: '#f3f4f6',
              color: '#374151',
              border: '1px solid #d1d5db'
            }}>
              📁 {issue.category}
            </span>
          )}
        </div>
      </div>
      <h3 style={{ 
        fontSize: '16px', 
        fontWeight: '600', 
        marginBottom: '8px',
        color: '#111827'
      }}>
        {issue.title}
      </h3>
      {issue.description && (
        <p style={{ 
          fontSize: '14px', 
          color: '#6b7280', 
          marginBottom: '12px',
          lineHeight: '1.5'
        }}>
          {issue.description}
        </p>
      )}
      <div style={{ 
        display: 'flex', 
        gap: '16px', 
        fontSize: '12px', 
        color: '#9ca3af',
        paddingTop: '12px',
        borderTop: '1px solid #f3f4f6'
      }}>
        <span>📅 Erstellt: {formatDate(issue.created_at)}</span>
        {issue.updated_at !== issue.created_at && (
          <span>🔄 Aktualisiert: {formatDate(issue.updated_at)}</span>
        )}
      </div>
    </div>
  );
}
