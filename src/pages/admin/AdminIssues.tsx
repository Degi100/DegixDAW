// ============================================================================
// ADMIN ISSUES PAGE - Enhanced with Assignment, Labels, Comments, PR
// ============================================================================

import { useState } from 'react';
import AdminLayoutCorporate from '../../components/admin/AdminLayoutCorporate';
import { useIssues, type IssueWithDetails, type CreateIssueRequest, type UpdateIssueRequest } from '../../hooks/useIssues';
import { useAuth } from '../../hooks/useAuth';
import { Spinner } from '../../components/ui/Loading';
import IssueModalEnhanced from '../../components/admin/IssueModalEnhanced';
import IssueCommentPanel from '../../components/admin/IssueCommentPanel';
import IssueStatsCards from '../../components/admin/IssueStatsCards';
import IssueFilters from '../../components/admin/IssueFilters';
import IssueList from '../../components/admin/IssueList';
import { bulkUpdateStatus, bulkUpdatePriority, bulkDeleteIssues } from '../../lib/services/issues';
import { formatRelativeTime } from '../../lib/services/issues';
import { useToast } from '../../hooks/useToast';

export default function AdminIssues() {
  const { user } = useAuth();
  const { success, error: showError } = useToast();
  const { issues, loading, createIssue, updateIssue, deleteIssue, assignIssue, getStats, refresh } = useIssues();

  // UI State
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date-desc');
  const [selectedIssueIds, setSelectedIssueIds] = useState<string[]>([]);
  const [showCompleted, setShowCompleted] = useState(false);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedIssue, setSelectedIssue] = useState<IssueWithDetails | null>(null);

  // Comment Panel State
  const [commentPanelOpen, setCommentPanelOpen] = useState(false);
  const [commentIssue, setCommentIssue] = useState<IssueWithDetails | null>(null);

  // ============================================================================
  // FILTERING & SORTING
  // ============================================================================

  const filteredIssues = issues.filter((issue) => {
    if (statusFilter !== 'all' && issue.status !== statusFilter) return false;
    if (priorityFilter !== 'all' && issue.priority !== priorityFilter) return false;
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      if (
        !issue.title.toLowerCase().includes(search) &&
        !issue.description?.toLowerCase().includes(search)
      ) {
        return false;
      }
    }
    return true;
  });

  const visibleIssues = showCompleted
    ? filteredIssues
    : filteredIssues.filter((i) => i.status !== 'done' && i.status !== 'closed');

  const completedCount = filteredIssues.filter((i) => i.status === 'done' || i.status === 'closed').length;

  // Sort issues
  const sortedIssues = [...visibleIssues].sort((a, b) => {
    const aCompleted = a.status === 'done' || a.status === 'closed';
    const bCompleted = b.status === 'done' || b.status === 'closed';

    if (aCompleted !== bCompleted) return aCompleted ? 1 : -1;

    switch (sortBy) {
      case 'date-desc':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case 'date-asc':
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      case 'priority-desc': {
        const order = { critical: 4, high: 3, medium: 2, low: 1 };
        return order[b.priority] - order[a.priority];
      }
      case 'priority-asc': {
        const order = { critical: 4, high: 3, medium: 2, low: 1 };
        return order[a.priority] - order[b.priority];
      }
      default:
        return 0;
    }
  });

  const stats = getStats();

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleCreateClick = () => {
    setSelectedIssue(null);
    setModalMode('create');
    setModalOpen(true);
  };

  const handleEditClick = (issue: IssueWithDetails) => {
    setSelectedIssue(issue);
    setModalMode('edit');
    setModalOpen(true);
  };

  const handleDeleteClick = async (issue: IssueWithDetails) => {
    if (!confirm(`Issue "${issue.title}" wirklich löschen?`)) return;
    await deleteIssue(issue.id);
  };

  const handleModalSubmit = async (data: CreateIssueRequest | UpdateIssueRequest) => {
    if (modalMode === 'create') {
      await createIssue(data as CreateIssueRequest);
    } else if (selectedIssue) {
      await updateIssue(selectedIssue.id, data);
    }
  };

  const handlePriorityChange = async (issueId: string, priority: string) => {
    await updateIssue(issueId, { priority: priority as any });
  };

  const handleStatusProgress = async (issueId: string, newStatus: string) => {
    await updateIssue(issueId, { status: newStatus as any });
  };

  const handleCopyClick = (issue: IssueWithDetails) => {
    setSelectedIssue({
      ...issue,
      title: `${issue.title} (Copy)`,
      id: '',
    } as IssueWithDetails);
    setModalMode('create');
    setModalOpen(true);
  };

  const handleAssignClick = async (issue: IssueWithDetails) => {
    if (!user) return;

    // If assigned to current user, unassign
    if (issue.assigned_to_id === user.id) {
      await assignIssue(issue.id, null);
      success('Zuweisung aufgehoben! 🔓');
    } else {
      // Try to assign to current user
      const result = await assignIssue(issue.id, user.id);
      if (!result.success) {
        showError(result.error || 'Fehler beim Zuweisen');
      }
    }
  };

  const handleViewComments = (issue: IssueWithDetails) => {
    setCommentIssue(issue);
    setCommentPanelOpen(true);
  };

  // ============================================================================
  // BULK OPERATIONS
  // ============================================================================

  const handleToggleSelect = (issueId: string) => {
    setSelectedIssueIds((prev) =>
      prev.includes(issueId) ? prev.filter((id) => id !== issueId) : [...prev, issueId]
    );
  };

  const handleSelectAll = () => {
    if (selectedIssueIds.length === sortedIssues.length) {
      setSelectedIssueIds([]);
    } else {
      setSelectedIssueIds(sortedIssues.map((i) => i.id));
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`${selectedIssueIds.length} Issues wirklich löschen?`)) return;
    await bulkDeleteIssues(selectedIssueIds);
    setSelectedIssueIds([]);
    refresh();
  };

  const handleBulkStatusChange = async (newStatus: string) => {
    await bulkUpdateStatus(selectedIssueIds, newStatus as any);
    setSelectedIssueIds([]);
    refresh();
  };

  const handleBulkPriorityChange = async (newPriority: string) => {
    await bulkUpdatePriority(selectedIssueIds, newPriority as any);
    setSelectedIssueIds([]);
    refresh();
  };

  // ============================================================================
  // RENDER
  // ============================================================================

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
        <IssueStatsCards stats={stats} />

        <IssueFilters
          searchTerm={searchTerm}
          statusFilter={statusFilter}
          priorityFilter={priorityFilter}
          sortBy={sortBy}
          showCompleted={showCompleted}
          completedCount={completedCount}
          onSearchChange={setSearchTerm}
          onStatusChange={setStatusFilter}
          onPriorityChange={setPriorityFilter}
          onSortChange={setSortBy}
          onShowCompletedToggle={() => setShowCompleted(!showCompleted)}
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
                <option value="" disabled>
                  Status ändern
                </option>
                <option value="open">🔵 Open</option>
                <option value="in_progress">🟡 In Progress</option>
                <option value="done">✅ Done</option>
                <option value="closed">⚪ Closed</option>
              </select>
              <select onChange={(e) => handleBulkPriorityChange(e.target.value)} defaultValue="">
                <option value="" disabled>
                  Priorität ändern
                </option>
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
          onAssign={handleAssignClick}
          onViewComments={handleViewComments}
          formatDate={formatRelativeTime}
          onRefresh={refresh}
          onCreateNew={handleCreateClick}
        />
      </div>

      {/* Modal */}
      <IssueModalEnhanced
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleModalSubmit}
        issue={selectedIssue}
        mode={modalMode}
      />

      {/* Comment Panel */}
      {commentPanelOpen && commentIssue && (
        <IssueCommentPanel
          issueId={commentIssue.id}
          issueTitle={commentIssue.title}
          onClose={() => setCommentPanelOpen(false)}
        />
      )}
    </AdminLayoutCorporate>
  );
}
