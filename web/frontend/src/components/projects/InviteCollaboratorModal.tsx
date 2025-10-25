// ============================================
// INVITE COLLABORATOR MODAL
// Invite users to project with role & permissions
// Tabs: Search Users (registered) + Invite by Email (non-registered)
// ============================================

import { useState } from 'react';
import { useUserSearch, type SearchUser } from '../../hooks/useUserSearch';
import Button from '../ui/Button';

interface InviteCollaboratorModalProps {
  projectId: string;
  onClose: () => void;
  onInvite: (data: InviteCollaboratorData) => Promise<void>;
}

export interface InviteCollaboratorData {
  user_id: string;
  role: 'viewer' | 'contributor' | 'mixer' | 'admin';
  can_edit: boolean;
  can_download: boolean;
  can_upload_audio: boolean;
  can_upload_mixdown: boolean;
  can_comment: boolean;
  can_invite_others: boolean;
}

// Role presets for quick selection
const ROLE_PRESETS: Record<string, Omit<InviteCollaboratorData, 'user_id'>> = {
  viewer: {
    role: 'viewer',
    can_edit: false,
    can_download: true,
    can_upload_audio: false,
    can_upload_mixdown: false,
    can_comment: true,
    can_invite_others: false,
  },
  contributor: {
    role: 'contributor',
    can_edit: true,
    can_download: true,
    can_upload_audio: true,
    can_upload_mixdown: false,
    can_comment: true,
    can_invite_others: false,
  },
  mixer: {
    role: 'mixer',
    can_edit: true,
    can_download: true,
    can_upload_audio: true,
    can_upload_mixdown: true,
    can_comment: true,
    can_invite_others: false,
  },
  admin: {
    role: 'admin',
    can_edit: true,
    can_download: true,
    can_upload_audio: true,
    can_upload_mixdown: true,
    can_comment: true,
    can_invite_others: true,
  },
};

export default function InviteCollaboratorModal({
  onClose,
  onInvite,
}: InviteCollaboratorModalProps) {
  const [activeTab, setActiveTab] = useState<'search' | 'email'>('search');
  const [selectedUser, setSelectedUser] = useState<SearchUser | null>(null);
  const [email, setEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState<keyof typeof ROLE_PRESETS>('viewer');
  const [permissions, setPermissions] = useState(ROLE_PRESETS.viewer);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // useUserSearch hook for auto-complete
  const { results, loading: searchLoading, debouncedSearch, clearSearch } = useUserSearch();

  // Update permissions when role changes
  const handleRoleChange = (role: keyof typeof ROLE_PRESETS) => {
    setSelectedRole(role);
    setPermissions(ROLE_PRESETS[role]);
  };

  // Toggle individual permission
  const togglePermission = (key: keyof Omit<InviteCollaboratorData, 'user_id' | 'role'>) => {
    setPermissions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Handle user selection from search results
  const handleSelectUser = (user: SearchUser) => {
    setSelectedUser(user);
    clearSearch();
    setError(null);
  };

  // Handle search input change
  const handleSearchChange = (value: string) => {
    setSelectedUser(null);
    if (value.trim()) {
      debouncedSearch(value);
    } else {
      clearSearch();
    }
  };

  // Submit: Search tab (registered users)
  const handleSubmitSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedUser) {
      setError('Please select a user from the search results');
      return;
    }

    setLoading(true);

    try {
      await onInvite({
        user_id: selectedUser.id,
        ...permissions,
      });

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send invite');
    } finally {
      setLoading(false);
    }
  };

  // Submit: Email tab (non-registered users)
  const handleSubmitEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      // TODO: Implement email invitation for non-registered users
      // This will create a pending invitation and send an email
      alert('Email invitation feature coming soon!');
      setError('Email invitation feature is not yet implemented');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send email invitation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content invite-collaborator-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Invite Collaborator</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        {/* Tabs */}
        <div className="invite-tabs">
          <button
            className={`invite-tab ${activeTab === 'search' ? 'active' : ''}`}
            onClick={() => setActiveTab('search')}
            type="button"
          >
            🔍 Search Users
          </button>
          <button
            className={`invite-tab ${activeTab === 'email' ? 'active' : ''}`}
            onClick={() => setActiveTab('email')}
            type="button"
          >
            ✉️ Invite by Email
          </button>
        </div>

        <form onSubmit={activeTab === 'search' ? handleSubmitSearch : handleSubmitEmail} className="modal-body">
          {/* Tab 1: Search Users */}
          {activeTab === 'search' && (
            <>
              <div className="form-group">
                <label htmlFor="search">Search by name or username</label>
                <input
                  type="text"
                  id="search"
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="Type to search..."
                  className="form-input"
                  autoComplete="off"
                />
                <p className="form-hint">
                  Start typing to find registered users
                </p>
              </div>

              {/* Search Results Dropdown */}
              {results.length > 0 && (
                <div className="user-search-results">
                  {results.map((user) => (
                    <div
                      key={user.id}
                      className="user-result-item"
                      onClick={() => handleSelectUser(user)}
                    >
                      <div className="user-avatar">
                        {user.avatar_url ? (
                          <img src={user.avatar_url} alt={user.username} />
                        ) : (
                          <div className="avatar-placeholder">
                            {user.full_name?.[0]?.toUpperCase() || user.username[0].toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="user-info">
                        <div className="user-name">{user.full_name || 'Unknown'}</div>
                        <div className="user-username">@{user.username}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {searchLoading && <p className="search-loading">Searching...</p>}

              {/* Selected User */}
              {selectedUser && (
                <div className="selected-user">
                  <p className="selected-label">Selected:</p>
                  <div className="user-result-item selected">
                    <div className="user-avatar">
                      {selectedUser.avatar_url ? (
                        <img src={selectedUser.avatar_url} alt={selectedUser.username} />
                      ) : (
                        <div className="avatar-placeholder">
                          {selectedUser.full_name?.[0]?.toUpperCase() || selectedUser.username[0].toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="user-info">
                      <div className="user-name">{selectedUser.full_name || 'Unknown'}</div>
                      <div className="user-username">@{selectedUser.username}</div>
                    </div>
                    <button
                      type="button"
                      className="clear-selection"
                      onClick={() => setSelectedUser(null)}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Tab 2: Invite by Email */}
          {activeTab === 'email' && (
            <>
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="form-input"
                  required
                />
                <p className="form-hint">
                  Invite someone who doesn't have an account yet
                </p>
              </div>

              <div className="email-invite-info">
                <p>📧 They will receive an email with instructions to join DegixDAW</p>
                <p>✅ Once they sign up, they'll automatically be added to this project</p>
              </div>
            </>
          )}

          {/* Role Selection (both tabs) */}
          <div className="form-group">
            <label>Role</label>
            <div className="role-buttons">
              {Object.keys(ROLE_PRESETS).map((role) => (
                <button
                  key={role}
                  type="button"
                  className={`role-button ${selectedRole === role ? 'active' : ''}`}
                  onClick={() => handleRoleChange(role as keyof typeof ROLE_PRESETS)}
                >
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Permissions */}
          <div className="form-group">
            <label>Permissions</label>
            <div className="permissions-list">
              <label className="permission-item">
                <input
                  type="checkbox"
                  checked={permissions.can_edit}
                  onChange={() => togglePermission('can_edit')}
                />
                <span>Edit Tracks</span>
              </label>
              <label className="permission-item">
                <input
                  type="checkbox"
                  checked={permissions.can_download}
                  onChange={() => togglePermission('can_download')}
                />
                <span>Download</span>
              </label>
              <label className="permission-item">
                <input
                  type="checkbox"
                  checked={permissions.can_upload_audio}
                  onChange={() => togglePermission('can_upload_audio')}
                />
                <span>Upload Audio</span>
              </label>
              <label className="permission-item">
                <input
                  type="checkbox"
                  checked={permissions.can_upload_mixdown}
                  onChange={() => togglePermission('can_upload_mixdown')}
                />
                <span>Upload Mixdown</span>
              </label>
              <label className="permission-item">
                <input
                  type="checkbox"
                  checked={permissions.can_comment}
                  onChange={() => togglePermission('can_comment')}
                />
                <span>Comment</span>
              </label>
              <label className="permission-item">
                <input
                  type="checkbox"
                  checked={permissions.can_invite_others}
                  onChange={() => togglePermission('can_invite_others')}
                />
                <span>Invite Others</span>
              </label>
            </div>
          </div>

          {/* Error Message */}
          {error && <div className="error-message">{error}</div>}

          {/* Actions */}
          <div className="modal-actions">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={loading || (activeTab === 'search' && !selectedUser)}
            >
              {loading ? 'Sending...' : 'Send Invite'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
