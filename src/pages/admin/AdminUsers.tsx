// src/pages/admin/AdminUsers.tsx
// ADVANCED User Management - Refactored & Slim

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

  // Form states
  const [newUserData, setNewUserData] = useState({
    email: '',
    password: '',
    full_name: '',
    username: '',
    role: 'user' as 'admin' | 'user' | 'moderator',
    phone: '',
    sendWelcomeEmail: true
  });

  // Advanced features
  const [exportFormat, setExportFormat] = useState<'csv' | 'json' | 'xlsx'>('csv');

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
  // CRUD OPERATIONS
  // ============================================

  const handleCreateUser = async () => {
    await createUser(newUserData);
    setShowCreateModal(false);
    setNewUserData({
      email: '',
      password: '',
      full_name: '',
      username: '',
      role: 'user',
      phone: '',
      sendWelcomeEmail: true
    });
  };

  const handleEditUser = async () => {
    if (!selectedUser) return;
    await updateUser(selectedUser);
    setShowEditModal(false);
    setSelectedUser(null);
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    await deleteUser(selectedUser.id);
    setShowDeleteModal(false);
    setSelectedUser(null);
  };

  // ============================================
  // EXPORT FUNCTIONALITY
  // ============================================

  const handleExport = () => {
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

    if (exportFormat === 'json') {
      const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `users_export_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (exportFormat === 'csv') {
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

    setShowExportModal(false);
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

        {/* Modals */}
        {showCreateModal && (
          <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>➕ Create New User</h3>
                <button className="modal-close" onClick={() => setShowCreateModal(false)}>×</button>
              </div>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label>Email *</label>
                    <input
                      type="email"
                      value={newUserData.email}
                      onChange={(e) => setNewUserData({...newUserData, email: e.target.value})}
                      placeholder="user@example.com"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Password *</label>
                    <input
                      type="password"
                      value={newUserData.password}
                      onChange={(e) => setNewUserData({...newUserData, password: e.target.value})}
                      placeholder="Minimum 6 characters"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Full Name *</label>
                    <input
                      type="text"
                      value={newUserData.full_name}
                      onChange={(e) => setNewUserData({...newUserData, full_name: e.target.value})}
                      placeholder="John Doe"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Username</label>
                    <input
                      type="text"
                      value={newUserData.username}
                      onChange={(e) => setNewUserData({...newUserData, username: e.target.value})}
                      placeholder="johndoe"
                    />
                  </div>
                  <div className="form-group">
                    <label>Role</label>
                    <select
                      value={newUserData.role}
                      onChange={(e) => setNewUserData({...newUserData, role: e.target.value as 'admin' | 'user' | 'moderator'})}
                    >
                      <option value="user">User</option>
                      <option value="moderator">Moderator</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Phone</label>
                    <input
                      type="tel"
                      value={newUserData.phone}
                      onChange={(e) => setNewUserData({...newUserData, phone: e.target.value})}
                      placeholder="+49 123 456789"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={newUserData.sendWelcomeEmail}
                      onChange={(e) => setNewUserData({...newUserData, sendWelcomeEmail: e.target.checked})}
                    />
                    Send welcome email to user
                  </label>
                </div>
              </div>
              <div className="modal-footer">
                <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleCreateUser}
                  disabled={!newUserData.email || !newUserData.password || !newUserData.full_name}
                >
                  Create User
                </Button>
              </div>
            </div>
          </div>
        )}

        {showEditModal && selectedUser && (
          <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>✏️ Edit User</h3>
                <button className="modal-close" onClick={() => setShowEditModal(false)}>×</button>
              </div>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label>Email (read-only)</label>
                    <input type="email" value={selectedUser.email} disabled />
                  </div>
                  <div className="form-group">
                    <label>Full Name</label>
                    <input
                      type="text"
                      value={selectedUser.full_name || ''}
                      onChange={(e) => setSelectedUser({...selectedUser, full_name: e.target.value})}
                      placeholder="John Doe"
                    />
                  </div>
                  <div className="form-group">
                    <label>Username</label>
                    <input
                      type="text"
                      value={selectedUser.username || ''}
                      onChange={(e) => setSelectedUser({...selectedUser, username: e.target.value})}
                      placeholder="johndoe"
                    />
                  </div>
                  <div className="form-group">
                    <label>Role</label>
                    <select
                      value={selectedUser.role || 'user'}
                      onChange={(e) => setSelectedUser({...selectedUser, role: e.target.value as 'admin' | 'user' | 'moderator'})}
                    >
                      <option value="user">User</option>
                      <option value="moderator">Moderator</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Phone</label>
                    <input
                      type="tel"
                      value={selectedUser.phone || ''}
                      onChange={(e) => setSelectedUser({...selectedUser, phone: e.target.value})}
                      placeholder="+49 123 456789"
                    />
                  </div>
                  <div className="form-group">
                    <label>Status</label>
                    <select
                      value={selectedUser.is_active === false ? 'inactive' : 'active'}
                      onChange={(e) => setSelectedUser({...selectedUser, is_active: e.target.value === 'active'})}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <Button variant="outline" onClick={() => setShowEditModal(false)}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={handleEditUser}>
                  Update User
                </Button>
              </div>
            </div>
          </div>
        )}

        {showDeleteModal && selectedUser && (
          <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>���️ Delete User</h3>
                <button className="modal-close" onClick={() => setShowDeleteModal(false)}>×</button>
              </div>
              <div className="modal-body">
                <p>Are you sure you want to delete this user?</p>
                <div className="user-delete-info">
                  <strong>{selectedUser.full_name || selectedUser.username || 'Unnamed User'}</strong>
                  <br />
                  <small>{selectedUser.email}</small>
                </div>
                <p style={{ color: '#dc3545', marginTop: '1rem' }}>
                  <strong>Warning:</strong> This action cannot be undone. The user will be permanently removed from the system.
                </p>
              </div>
              <div className="modal-footer">
                <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleDeleteUser}
                  style={{ backgroundColor: '#dc3545', borderColor: '#dc3545' }}
                >
                  Delete User
                </Button>
              </div>
            </div>
          </div>
        )}

        {showBulkModal && selectedUsers.size > 0 && (
          <div className="modal-overlay" onClick={() => setShowBulkModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>⚡ Bulk Actions</h3>
                <button className="modal-close" onClick={() => setShowBulkModal(false)}>×</button>
              </div>
              <div className="modal-body">
                <p>Apply action to {selectedUsers.size} selected users:</p>
                <div className="bulk-actions">
                  <Button variant="success" onClick={handleBulkActivate}>
                    ✅ Activate Users
                  </Button>
                  <Button variant="error" onClick={handleBulkDeactivate}>
                    ⏸️ Deactivate Users
                  </Button>
                  <Button
                    variant="error"
                    onClick={handleBulkDelete}
                    style={{ backgroundColor: '#dc3545', borderColor: '#dc3545' }}
                  >
                    ���️ Delete Users
                  </Button>
                </div>
              </div>
              <div className="modal-footer">
                <Button variant="outline" onClick={() => setShowBulkModal(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {showExportModal && (
          <div className="modal-overlay" onClick={() => setShowExportModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>��� Export Users</h3>
                <button className="modal-close" onClick={() => setShowExportModal(false)}>×</button>
              </div>
              <div className="modal-body">
                <p>Export {filteredAndSortedUsers.length} users in the current filter:</p>
                <div className="form-group">
                  <label>Export Format</label>
                  <select
                    value={exportFormat}
                    onChange={(e) => setExportFormat(e.target.value as 'csv' | 'json' | 'xlsx')}
                  >
                    <option value="csv">CSV (Spreadsheet)</option>
                    <option value="json">JSON (Developer)</option>
                  </select>
                </div>
                <div className="export-preview">
                  <strong>Columns to export:</strong>
                  <div className="export-columns">
                    ID, Email, Full Name, Username, Role, Status, Created At, Last Sign In, Phone
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <Button variant="outline" onClick={() => setShowExportModal(false)}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={handleExport}>
                  ��� Export {exportFormat.toUpperCase()}
                </Button>
              </div>
            </div>
          </div>
        )}

        {showAnalyticsModal && stats && (
          <div className="modal-overlay" onClick={() => setShowAnalyticsModal(false)}>
            <div className="modal-content large-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>��� User Analytics</h3>
                <button className="modal-close" onClick={() => setShowAnalyticsModal(false)}>×</button>
              </div>
              <div className="modal-body">
                <div className="analytics-grid">
                  <div className="analytics-card">
                    <h4>Growth Metrics</h4>
                    <div className="metric">
                      <span className="metric-label">Recent Signups (7d)</span>
                      <span className="metric-value">{stats.recentSignups}</span>
                    </div>
                    <div className="metric">
                      <span className="metric-label">Active (24h)</span>
                      <span className="metric-value">{stats.last24h}</span>
                    </div>
                    <div className="metric">
                      <span className="metric-label">Active (7d)</span>
                      <span className="metric-value">{stats.last7d}</span>
                    </div>
                    <div className="metric">
                      <span className="metric-label">Active (30d)</span>
                      <span className="metric-value">{stats.last30d}</span>
                    </div>
                  </div>

                  <div className="analytics-card">
                    <h4>User Distribution</h4>
                    <div className="metric">
                      <span className="metric-label">Total Users</span>
                      <span className="metric-value">{stats.total}</span>
                    </div>
                    <div className="metric">
                      <span className="metric-label">Active Users</span>
                      <span className="metric-value">{stats.active}</span>
                      <span className="metric-percent">({((stats.active / stats.total) * 100).toFixed(1)}%)</span>
                    </div>
                    <div className="metric">
                      <span className="metric-label">Inactive Users</span>
                      <span className="metric-value">{stats.inactive}</span>
                      <span className="metric-percent">({((stats.inactive / stats.total) * 100).toFixed(1)}%)</span>
                    </div>
                    <div className="metric">
                      <span className="metric-label">Pending Users</span>
                      <span className="metric-value">{stats.pending}</span>
                      <span className="metric-percent">({((stats.pending / stats.total) * 100).toFixed(1)}%)</span>
                    </div>
                  </div>

                  <div className="analytics-card">
                    <h4>Role Distribution</h4>
                    <div className="metric">
                      <span className="metric-label">Administrators</span>
                      <span className="metric-value">{stats.admins}</span>
                      <span className="metric-percent">({((stats.admins / stats.total) * 100).toFixed(1)}%)</span>
                    </div>
                    <div className="metric">
                      <span className="metric-label">Moderators</span>
                      <span className="metric-value">{users.filter(u => u.role === 'moderator').length}</span>
                    </div>
                    <div className="metric">
                      <span className="metric-label">Regular Users</span>
                      <span className="metric-value">{users.filter(u => !u.role || u.role === 'user').length}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <Button variant="outline" onClick={() => setShowExportModal(true)}>
                  ��� Export Data
                </Button>
                <Button variant="primary" onClick={() => setShowAnalyticsModal(false)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayoutCorporate>
  );
}
