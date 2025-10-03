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
  const { success: showSuccess, error: showError } = useToast();
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date-desc');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);

  const filteredIssues = filterIssues({
    status: statusFilter === 'all' ? undefined : statusFilter,
    priority: priorityFilter === 'all' ? undefined : priorityFilter,
    search: searchTerm || undefined,
  });

  // Sort issues based on selected option
  const sortedIssues = [...filteredIssues].sort((a, b) => {
    switch (sortBy) {
      case 'date-desc':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case 'date-asc':
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      case 'priority-desc': {
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      case 'priority-asc': {
        const priorityOrderAsc = { critical: 4, high: 3, medium: 2, low: 1 };
        return priorityOrderAsc[a.priority] - priorityOrderAsc[b.priority];
      }
      case 'status': {
        const statusOrder = { open: 1, 'in-progress': 2, done: 3, closed: 4 };
        return statusOrder[a.status] - statusOrder[b.status];
      }
      case 'title-asc':
        return a.title.localeCompare(b.title);
      case 'title-desc':
        return b.title.localeCompare(a.title);
      default:
        return 0;
    }
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

  const handleCopyClick = async (issue: Issue) => {
    const copiedIssue = {
      title: `${issue.title} (Kopie)`,
      description: issue.description || '',
      status: issue.status,
      priority: issue.priority,
      category: issue.category || '',
    };
    
    const result = await createIssue(copiedIssue);
    if (result.success) {
      showSuccess('Issue erfolgreich kopiert');
    } else {
      showError('Fehler beim Kopieren des Issues');
    }
  };

  const handleExportClick = () => {
    const exportData = sortedIssues.map(issue => ({
      id: issue.id,
      title: issue.title,
      description: issue.description,
      status: issue.status,
      priority: issue.priority,
      category: issue.category,
      created_at: issue.created_at,
    }));

    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `issues-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showSuccess(`${exportData.length} Issues exportiert`);
  };

  const handleSaveMarkdown = async () => {
    const date = new Date().toISOString().split('T')[0];
    let markdown = `# Issue Management Report\n\n`;
    markdown += `**Datum:** ${date}\n`;
    markdown += `**Total Issues:** ${stats.total}\n\n`;
    
    // Stats
    markdown += `## 📊 Statistiken\n\n`;
    markdown += `- 🔵 **Open:** ${stats.open}\n`;
    markdown += `- 🟡 **In Progress:** ${stats.inProgress}\n`;
    markdown += `- ✅ **Done:** ${stats.done}\n`;
    markdown += `- ⚪ **Closed:** ${stats.closed}\n`;
    markdown += `- 🚨 **Urgent (High/Critical):** ${stats.urgentCount}\n\n`;
    
    // Issues grouped by status
    const groupedByStatus = {
      open: sortedIssues.filter(i => i.status === 'open'),
      'in-progress': sortedIssues.filter(i => i.status === 'in-progress'),
      done: sortedIssues.filter(i => i.status === 'done'),
      closed: sortedIssues.filter(i => i.status === 'closed'),
    };

    Object.entries(groupedByStatus).forEach(([status, issues]) => {
      if (issues.length === 0) return;
      
      const statusConfig = {
        open: '🔵 Open',
        'in-progress': '🟡 In Progress',
        done: '✅ Done',
        closed: '⚪ Closed',
      };

      markdown += `## ${statusConfig[status as keyof typeof statusConfig]} (${issues.length})\n\n`;
      
      issues.forEach(issue => {
        const priorityEmoji = priorityConfig[issue.priority].emoji;
        markdown += `### ${priorityEmoji} ${issue.title}\n\n`;
        markdown += `- **Priority:** ${priorityConfig[issue.priority].label}\n`;
        markdown += `- **Category:** ${issue.category || 'N/A'}\n`;
        markdown += `- **Created:** ${new Date(issue.created_at).toLocaleDateString('de-DE')}\n`;
        if (issue.description) {
          markdown += `- **Description:** ${issue.description}\n`;
        }
        markdown += `\n---\n\n`;
      });
    });

    // Save to server (local dev) or download (production)
    const isProduction = import.meta.env.PROD;
    const isDevelopment = window.location.hostname === 'localhost';

    if (isDevelopment && !isProduction) {
      // LOCAL: Save via Express API server
      try {
        const response = await fetch('http://localhost:3001/api/save-markdown', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: markdown,
            filename: `ISSUES_${date}.md`,
          }),
        });

        const result = await response.json();

        if (result.success) {
          showSuccess(`📝 Markdown-Report im Projekt gespeichert: ISSUES_${date}.md`);
        } else {
          throw new Error(result.error || 'Failed to save file');
        }
      } catch (error) {
        console.error('Error saving markdown:', error);
        showError('Fehler beim Speichern. Ist der API-Server gestartet? (npm run api)');
      }
    } else {
      // PRODUCTION: Download file to browser
      const blob = new Blob([markdown], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ISSUES_${date}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showSuccess(`📥 Markdown-Report heruntergeladen: ISSUES_${date}.md`);
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
              onClick={handleExportClick} 
              title="Issues als JSON exportieren"
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <span>📥</span>
              <span>JSON</span>
            </button>
            <button 
              className="btn btn-secondary" 
              onClick={handleSaveMarkdown} 
              title="Issues als Markdown-Report speichern"
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <span>📝</span>
              <span>MD</span>
            </button>
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
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
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

        {/* Issues List */}
        {sortedIssues.length === 0 ? (
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
            {sortedIssues.map((issue) => (
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
                  {/* Quick Action Button - Smart Status Progression */}
                  {issue.status === 'open' && (
                    <button
                      onClick={async () => {
                        const result = await updateIssue(issue.id, { status: 'in-progress' });
                        if (result.success) {
                          showSuccess('Issue in Bearbeitung');
                        }
                      }}
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
                    onClick={() => handleCopyClick(issue)}
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

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px', paddingRight: '200px' }}>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <select
                      value={issue.priority}
                      onChange={async (e) => {
                        const newPriority = e.target.value as Issue['priority'];
                        const result = await updateIssue(issue.id, { priority: newPriority });
                        if (result.success) {
                          showSuccess(`Priorität auf ${priorityConfig[newPriority].label} geändert`);
                        }
                      }}
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
