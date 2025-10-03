// src/pages/admin/AdminUsers.tsx
// ADVANCED User Management - Refactored with Modular Components

import { useState, useRef } from 'react';
import AdminLayoutCorporate from '../../components/admin/AdminLayoutCorporate';
import Button from '../../components/ui/Button';
import { useUserData, type UserProfile } from '../../hooks/useUserData';
import { useUserFilters } from '../../hooks/useUserFilters';
import { useBulkOperations } from '../../hooks/useBulkOperations';
import { useUserStats } from '../../hooks/useUserStats';
import { useTheme } from '../../hooks/useTheme';
import UserStats from '../../components/admin/UserStats';
import AdvancedFilters from '../../components/admin/AdvancedFilters';
import SearchControls from '../../components/admin/SearchControls';
import RealtimeIndicator from '../../components/admin/RealtimeIndicator';
import UserTableRow from '../../components/admin/UserTableRow';

// Modal Components
import UserCreateModal from './components/modals/UserCreateModal';
import UserEditModal from './components/modals/UserEditModal';
import UserDeleteModal from './components/modals/UserDeleteModal';
import BulkActionsModal from './components/modals/BulkActionsModal';
import ExportModal from './components/modals/ExportModal';
import AnalyticsModal from './components/modals/AnalyticsModal';

import type { NewUserData, ExportFormat } from './types/admin.types';

export default function AdminUsers() {
  // Core state
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'table' | 'cards' | 'compact'>('table');
  const [pageSize, setPageSize] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);

  // Modal states
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);

  // Refs
  const searchInputRef = useRef<HTMLInputElement>(null);
  const tableRef = useRef<HTMLTableElement>(null);

  // Theme hook
  const { theme } = useTheme();

  // Custom hooks
  const {
    users,
    loading,
    lastUpdated,
    isRealtimeEnabled,
    setIsRealtimeEnabled,
    loadUsers,
    createUser,
    updateUser,
    deleteUser
  } = useUserData();

  const {
    searchTerm,
    setSearchTerm,
    filters,
    setFilters,
    filteredAndSortedUsers
  } = useUserFilters(users);

  const stats = useUserStats(users);

  const {
    handleBulkActivate,
    handleBulkDeactivate,
    handleBulkDelete
  } = useBulkOperations(selectedUsers, loadUsers, () => setSelectedUsers(new Set()));

  // Pagination
  const paginatedUsers = filteredAndSortedUsers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );
  const totalPages = Math.ceil(filteredAndSortedUsers.length / pageSize);

  // ============================================
  // MODAL HANDLERS
  // ============================================

  const handleCreateUser = async (userData: NewUserData) => {
    await createUser(userData);
  };

  const handleEditUser = async (user: UserProfile) => {
    await updateUser(user);
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    await deleteUser(selectedUser.id);
    setSelectedUser(null);
  };

  const handleExport = (format: ExportFormat) => {
    const dataToExport = filteredAndSortedUsers.map(user => ({
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      username: user.username,
      role: user.role,
      is_active: user.is_active,
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at,
      email_confirmed_at: user.email_confirmed_at,
      phone: user.phone
    }));

    if (format === 'json') {
      const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `users_export_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (format === 'csv') {
      const headers = Object.keys(dataToExport[0] || {}).join(',');
      const rows = dataToExport.map(row =>
        Object.values(row).map(val =>
          typeof val === 'string' && val.includes(',') ? `"${val}"` : val
        ).join(',')
      );
      const csv = [headers, ...rows].join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `users_export_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  // ============================================
  // UTILITY FUNCTIONS
  // ============================================

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <AdminLayoutCorporate>
      <div className={`admin-users ${theme}`}>
        {/* Modern Compact Header */}
        <div className="admin-header-modern">
          <div className="admin-header-content">
            <div className="admin-title-section">
              <h1 className="admin-main-title">👥 User Management</h1>
              <p className="admin-subtitle">Advanced administration with real-time capabilities</p>
            </div>

            <div className="admin-header-controls">
              <RealtimeIndicator
                isEnabled={isRealtimeEnabled}
                lastUpdated={lastUpdated}
                onToggle={() => setIsRealtimeEnabled(!isRealtimeEnabled)}
              />
            </div>
          </div>

          {/* Feature highlights - compact */}
          <div className="admin-features-bar">
            <span className="feature-tag">⚡ Real-time</span>
            <span className="feature-tag">📊 Analytics</span>
            <span className="feature-tag">🔧 Bulk Ops</span>
          </div>
        </div>

        <SearchControls
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onRefresh={loadUsers}
          onCreateUser={() => setShowCreateModal(true)}
          onBulkActions={() => setShowBulkModal(true)}
          onExport={() => setShowExportModal(true)}
          onAnalytics={() => setShowAnalyticsModal(true)}
          selectedCount={selectedUsers.size}
          searchInputRef={searchInputRef}
        />

        <AdvancedFilters
          filters={filters}
          onFiltersChange={setFilters}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />

        {stats && <UserStats stats={stats} />}

        {loading ? (
          <div className="admin-loading">
            <div className="loading-spinner"></div>
            <p>Loading users...</p>
          </div>
        ) : (
          <>
            <div className="results-info">
              Showing {paginatedUsers.length} of {filteredAndSortedUsers.length} users
              {searchTerm && ` matching "${searchTerm}"`}
            </div>

            {viewMode === 'table' && (
              <div className="users-table-container">
                <table ref={tableRef} className="admin-table corporate-table">
                  <thead>
                    <tr>
                      <th style={{ width: '40px' }}>
                        <input
                          type="checkbox"
                          checked={selectedUsers.size === paginatedUsers.length && paginatedUsers.length > 0}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedUsers(new Set([...selectedUsers, ...paginatedUsers.map(u => u.id)]));
                            } else {
                              const newSelected = new Set(selectedUsers);
                              paginatedUsers.forEach(u => newSelected.delete(u.id));
                              setSelectedUsers(newSelected);
                            }
                          }}
                        />
                      </th>
                      <th>User</th>
                      <th>Contact</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Registered</th>
                      <th>Last Login</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedUsers.map((user) => (
                      <UserTableRow
                        key={user.id}
                        user={user}
                        isSelected={selectedUsers.has(user.id)}
                        onSelectChange={(selected: boolean) => {
                          const newSelected = new Set(selectedUsers);
                          if (selected) {
                            newSelected.add(user.id);
                          } else {
                            newSelected.delete(user.id);
                          }
                          setSelectedUsers(newSelected);
                        }}
                        onEdit={() => {
                          setSelectedUser(user);
                          setShowEditModal(true);
                        }}
                        onDelete={() => {
                          setSelectedUser(user);
                          setShowDeleteModal(true);
                        }}
                        formatDate={formatDate}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {totalPages > 1 && (
              <div className="pagination">
                <Button
                  variant="outline"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(1)}
                >
                  First
                </Button>
                <Button
                  variant="outline"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                >
                  Previous
                </Button>

                <span className="page-info">
                  Page {currentPage} of {totalPages}
                </span>

                <Button
                  variant="outline"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                >
                  Next
                </Button>
                <Button
                  variant="outline"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(totalPages)}
                >
                  Last
                </Button>

                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="page-size-select"
                >
                  <option value={10}>10 per page</option>
                  <option value={25}>25 per page</option>
                  <option value={50}>50 per page</option>
                  <option value={100}>100 per page</option>
                </select>
              </div>
            )}

            {filteredAndSortedUsers.length === 0 && !loading && (
              <div className="no-users">
                <p>
                  {searchTerm
                    ? `No users found matching "${searchTerm}"`
                    : 'No users registered yet'
                  }
                </p>
              </div>
            )}
          </>
        )}

        {/* Modals - Now as separate components */}
        <UserCreateModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onCreateUser={handleCreateUser}
        />

        {selectedUser && (
          <>
            <UserEditModal
              isOpen={showEditModal}
              onClose={() => {
                setShowEditModal(false);
                setSelectedUser(null);
              }}
              user={selectedUser}
              onUpdateUser={handleEditUser}
            />

            <UserDeleteModal
              isOpen={showDeleteModal}
              onClose={() => {
                setShowDeleteModal(false);
                setSelectedUser(null);
              }}
              user={selectedUser}
              onDeleteUser={handleDeleteUser}
            />
          </>
        )}

        <BulkActionsModal
          isOpen={showBulkModal}
          onClose={() => setShowBulkModal(false)}
          selectedCount={selectedUsers.size}
          onBulkActivate={handleBulkActivate}
          onBulkDeactivate={handleBulkDeactivate}
          onBulkDelete={handleBulkDelete}
        />

        <ExportModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          totalUsers={filteredAndSortedUsers.length}
          onExport={handleExport}
        />

        {stats && (
          <AnalyticsModal
            isOpen={showAnalyticsModal}
            onClose={() => setShowAnalyticsModal(false)}
            stats={stats}
            users={users}
            onOpenExport={() => {
              setShowAnalyticsModal(false);
              setShowExportModal(true);
            }}
          />
        )}
      </div>
    </AdminLayoutCorporate>
  );
}
