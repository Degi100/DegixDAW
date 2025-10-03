// src/pages/admin/AdminIssues.tsx
// Issue Management Page with full CRUD

import { useState } from 'react';
import AdminLayoutCorporate from '../../components/admin/AdminLayoutCorporate';
import { useIssues } from '../../hooks/useIssues';
import type { Issue } from '../../hooks/useIssues';
import { Spinner } from '../../components/ui/Loading';
import IssueModal, { type IssueFormData } from '../../components/admin/IssueModal';
import { useToast } from '../../hooks/useToast';

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

export default function AdminIssues() {
  const { loading, filterIssues, getStats, refresh, createIssue, updateIssue, deleteIssue } = useIssues();
  const { showSuccess, showError } = useToast();
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);

  const filteredIssues = filterIssues({
    status: statusFilter === 'all' ? undefined : statusFilter,
    priority: priorityFilter === 'all' ? undefined : priorityFilter,
    search: searchTerm || undefined,
  });

  const stats = getStats();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `vor ${diffMins}min`;
    if (diffHours < 24) return `vor ${diffHours}h`;
    if (diffDays < 7) return `vor ${diffDays}d`;
    return date.toLocaleDateString('de-DE', { day: '2-digit', month: 'short' });
  };

  const handleCreateClick = () => {
    setSelectedIssue(null);
    setModalMode('create');
    setModalOpen(true);
  };

  const handleEditClick = (issue: Issue) => {
    setSelectedIssue(issue);
    setModalMode('edit');
    setModalOpen(true);
  };

  const handleDeleteClick = async (issue: Issue) => {
    if (!confirm(`Issue "${issue.title}" wirklich löschen?`)) return;
    
    const result = await deleteIssue(issue.id);
    if (result.success) {
      showSuccess('Issue erfolgreich gelöscht');
    } else {
      showError('Fehler beim Löschen des Issues');
    }
  };

  const handleModalSubmit = async (data: IssueFormData) => {
    if (modalMode === 'create') {
      const result = await createIssue(data);
      if (result.success) {
        showSuccess('Issue erfolgreich erstellt');
      }
    } else if (selectedIssue) {
      const result = await updateIssue(selectedIssue.id, data);
      if (result.success) {
        showSuccess('Issue erfolgreich aktualisiert');
      }
    }
  };

  if (loading) {
    return (
      <AdminLayoutCorporate>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <Spinner size="large" />
        </div>
      </AdminLayoutCorporate>
    );
  }

  return (
    <AdminLayoutCorporate>
      <div className="admin-issues">
        {/* Header */}
        <div className="admin-issues-header">
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span>🐛</span>
              <span>Issue Management</span>
            </h1>
            <p style={{ fontSize: '14px', color: '#6b7280' }}>
              {stats.total} Issues gesamt
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              className="btn btn-secondary" 
              onClick={refresh} 
              title="Neu laden"
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <span>🔄</span>
              <span>Refresh</span>
            </button>
            <button 
              className="btn btn-primary"
              onClick={handleCreateClick}
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <span>➕</span>
              <span>New Issue</span>
            </button>
          </div>
        </div>

        {/* Stats Cards - Kompakt */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', 
          gap: '12px', 
          marginBottom: '20px' 
        }}>
          <div style={{ 
            background: '#dbeafe', 
            padding: '14px 16px', 
            borderRadius: '10px', 
            border: '1px solid #3b82f6',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div style={{ fontSize: '24px' }}>🔵</div>
            <div>
              <div style={{ fontSize: '20px', fontWeight: '700', color: '#1e40af', lineHeight: '1' }}>{stats.open}</div>
              <div style={{ fontSize: '12px', color: '#1e40af', marginTop: '2px' }}>Open</div>
            </div>
          </div>
          <div style={{ 
            background: '#fef3c7', 
            padding: '14px 16px', 
            borderRadius: '10px', 
            border: '1px solid #ca8a04',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div style={{ fontSize: '24px' }}>🟡</div>
            <div>
              <div style={{ fontSize: '20px', fontWeight: '700', color: '#92400e', lineHeight: '1' }}>{stats.inProgress}</div>
              <div style={{ fontSize: '12px', color: '#92400e', marginTop: '2px' }}>In Progress</div>
            </div>
          </div>
          <div style={{ 
            background: '#dcfce7', 
            padding: '14px 16px', 
            borderRadius: '10px', 
            border: '1px solid #16a34a',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div style={{ fontSize: '24px' }}>✅</div>
            <div>
              <div style={{ fontSize: '20px', fontWeight: '700', color: '#166534', lineHeight: '1' }}>{stats.done}</div>
              <div style={{ fontSize: '12px', color: '#166534', marginTop: '2px' }}>Done</div>
            </div>
          </div>
          {stats.urgentCount > 0 && (
            <div style={{ 
              background: '#fee2e2', 
              padding: '14px 16px', 
              borderRadius: '10px', 
              border: '1px solid #dc2626',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div style={{ fontSize: '24px' }}>🚨</div>
              <div>
                <div style={{ fontSize: '20px', fontWeight: '700', color: '#991b1b', lineHeight: '1' }}>{stats.urgentCount}</div>
                <div style={{ fontSize: '12px', color: '#991b1b', marginTop: '2px' }}>Urgent</div>
              </div>
            </div>
          )}
        </div>

        {/* Filters */}
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
              onChange={(e) => setSearchTerm(e.target.value)}
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
            onChange={(e) => setStatusFilter(e.target.value)}
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
            onChange={(e) => setPriorityFilter(e.target.value)}
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
        </div>

        {/* Issues List */}
        {filteredIssues.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            background: 'white',
            borderRadius: '12px',
            border: '2px dashed #d1d5db'
          }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>
              {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all' ? '🔍' : '📦'}
            </div>
            <p style={{ fontSize: '16px', color: '#6b7280' }}>
              {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all' 
                ? 'Keine Issues gefunden mit diesen Filtern.'
                : 'Keine Issues vorhanden.'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredIssues.map((issue) => (
              <div 
                key={issue.id} 
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
                  {issue.status !== 'done' && (
                    <button
                      onClick={async () => {
                        const result = await updateIssue(issue.id, { status: 'done' });
                        if (result.success) {
                          showSuccess('Issue als erledigt markiert');
                        }
                      }}
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
                    onClick={() => handleEditClick(issue)}
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
                    onClick={() => handleDeleteClick(issue)}
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

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px', paddingRight: '150px' }}>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '600',
                      background: priorityConfig[issue.priority].color + '20',
                      color: priorityConfig[issue.priority].color,
                      border: `1px solid ${priorityConfig[issue.priority].color}40`
                    }}>
                      <span>{priorityConfig[issue.priority].emoji}</span>
                      <span>{priorityConfig[issue.priority].label}</span>
                    </span>
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
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      <IssueModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleModalSubmit}
        issue={selectedIssue}
        mode={modalMode}
      />
    </AdminLayoutCorporate>
  );
}
