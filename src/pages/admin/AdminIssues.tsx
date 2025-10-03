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

        <IssueList
          issues={sortedIssues}
          searchTerm={searchTerm}
          statusFilter={statusFilter}
          priorityFilter={priorityFilter}
          onPriorityChange={handlePriorityChange}
          onStatusProgress={handleStatusProgress}
          onCopy={handleCopyClick}
          onEdit={handleEditClick}
          onDelete={handleDeleteClick}
          formatDate={formatDate}
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
