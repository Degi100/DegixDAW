// src/pages/admin/AdminIssues.tsx
// Issue Management Page - Refactored

import { useState } from 'react';
import AdminLayoutCorporate from '../../components/admin/AdminLayoutCorporate';
import { useIssues } from '../../hooks/useIssues';
import { Spinner } from '../../components/ui/Loading';
import IssueModal from '../../components/admin/IssueModal';
import IssueActions from '../../components/admin/IssueActions';
import IssueStatsCards from '../../components/admin/IssueStatsCards';
import IssueFilters from '../../components/admin/IssueFilters';
import IssueList from '../../components/admin/IssueList';
import { useIssueActions } from '../../hooks/useIssueActions';

export default function AdminIssues() {
  const { loading, filterIssues, getStats, refresh, createIssue, updateIssue, deleteIssue } = useIssues();
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date-desc');
  const [selectedIssueIds, setSelectedIssueIds] = useState<string[]>([]);

  const {
    modalOpen,
    modalMode,
    selectedIssue,
    setModalOpen,
    handleCreateClick,
    handleEditClick,
    handleDeleteClick,
    handleModalSubmit,
    handleCopyClick,
    handlePriorityChange,
    handleStatusProgress,
    handleExportClick,
    handleSaveMarkdown,
  } = useIssueActions(createIssue, updateIssue, deleteIssue, getStats);

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

  // Bulk Selection Handlers
  const handleToggleSelect = (issueId: string) => {
    setSelectedIssueIds(prev => 
      prev.includes(issueId) 
        ? prev.filter(id => id !== issueId)
        : [...prev, issueId]
    );
  };

  const handleSelectAll = () => {
    if (selectedIssueIds.length === sortedIssues.length) {
      setSelectedIssueIds([]);
    } else {
      setSelectedIssueIds(sortedIssues.map(issue => issue.id));
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`${selectedIssueIds.length} Issues wirklich löschen?`)) return;
    
    for (const id of selectedIssueIds) {
      await deleteIssue(id);
    }
    setSelectedIssueIds([]);
  };

  const handleBulkStatusChange = async (newStatus: string) => {
    const validStatuses = ['open', 'in-progress', 'done', 'closed'];
    if (!validStatuses.includes(newStatus)) return;

    for (const id of selectedIssueIds) {
      await updateIssue(id, { status: newStatus as 'open' | 'in-progress' | 'done' | 'closed' });
    }
    setSelectedIssueIds([]);
  };

  const handleBulkPriorityChange = async (newPriority: string) => {
    const validPriorities = ['low', 'medium', 'high', 'critical'];
    if (!validPriorities.includes(newPriority)) return;

    for (const id of selectedIssueIds) {
      await updateIssue(id, { priority: newPriority as 'low' | 'medium' | 'high' | 'critical' });
    }
    setSelectedIssueIds([]);
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
        <IssueActions
          totalIssues={stats.total}
          onExport={() => handleExportClick(sortedIssues)}
          onSaveMarkdown={() => handleSaveMarkdown(sortedIssues)}
          onRefresh={refresh}
          onCreateNew={handleCreateClick}
        />

        <IssueStatsCards stats={stats} />

        <IssueFilters
          searchTerm={searchTerm}
          statusFilter={statusFilter}
          priorityFilter={priorityFilter}
          sortBy={sortBy}
          onSearchChange={setSearchTerm}
          onStatusChange={setStatusFilter}
          onPriorityChange={setPriorityFilter}
          onSortChange={setSortBy}
          stats={stats}
        />

        {/* Bulk Actions Bar */}
        {selectedIssueIds.length > 0 && (
          <div className="bulk-actions-bar">
            <div className="bulk-actions-bar__info">
              <span>{selectedIssueIds.length} ausgewählt</span>
              <button onClick={() => setSelectedIssueIds([])}>Auswahl aufheben</button>
            </div>
            <div className="bulk-actions-bar__actions">
              <select onChange={(e) => handleBulkStatusChange(e.target.value)} defaultValue="">
                <option value="" disabled>Status ändern</option>
                <option value="open">🔵 Open</option>
                <option value="in-progress">🟡 In Progress</option>
                <option value="done">✅ Done</option>
                <option value="closed">⚪ Closed</option>
              </select>
              <select onChange={(e) => handleBulkPriorityChange(e.target.value)} defaultValue="">
                <option value="" disabled>Priorität ändern</option>
                <option value="low">🟢 Low</option>
                <option value="medium">🟡 Medium</option>
                <option value="high">🔴 High</option>
                <option value="critical">🚨 Critical</option>
              </select>
              <button onClick={handleBulkDelete} className="bulk-actions-bar__delete">
                🗑️ Löschen ({selectedIssueIds.length})
              </button>
            </div>
          </div>
        )}

        <IssueList
          issues={sortedIssues}
          searchTerm={searchTerm}
          statusFilter={statusFilter}
          priorityFilter={priorityFilter}
          selectedIssueIds={selectedIssueIds}
          onToggleSelect={handleToggleSelect}
          onSelectAll={handleSelectAll}
          onPriorityChange={handlePriorityChange}
          onStatusProgress={handleStatusProgress}
          onCopy={handleCopyClick}
          onEdit={handleEditClick}
          onDelete={handleDeleteClick}
          formatDate={formatDate}
          onExport={() => handleExportClick(sortedIssues.filter(i => selectedIssueIds.includes(i.id)))}
          onSaveMarkdown={() => handleSaveMarkdown(sortedIssues.filter(i => selectedIssueIds.includes(i.id)))}
          onRefresh={refresh}
          onCreateNew={handleCreateClick}
        />
      </div>

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
