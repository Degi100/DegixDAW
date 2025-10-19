// ============================================
// INVITE COLLABORATOR MODAL
// Invite users to project with role & permissions
// ============================================

import { useState } from 'react';
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
  const [email, setEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState<keyof typeof ROLE_PRESETS>('viewer');
  const [permissions, setPermissions] = useState(ROLE_PRESETS.viewer);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    setLoading(true);

    try {
      // TODO: Lookup user_id by email (needs backend endpoint or RPC function)
      // For now, we'll need to implement a lookup service
      const userId = 'temp-user-id'; // Placeholder

      await onInvite({
        user_id: userId,
        ...permissions,
      });

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send invite');
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

        <form onSubmit={handleSubmit} className="modal-body">
          {/* Email Input */}
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
          </div>

          {/* Role Selection */}
          <div className="form-group">
            <label>Role</label>
            <div className="role-buttons">
              {Object.keys(ROLE_PRESETS).map((role) => (
                <button
                  key={role}
                  type="button"
                  className={`role-btn ${selectedRole === role ? 'active' : ''}`}
                  onClick={() => handleRoleChange(role as keyof typeof ROLE_PRESETS)}
                >
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Permissions Grid */}
          <div className="form-group">
            <label>Permissions</label>
            <div className="permissions-grid">
              <label className="permission-item">
                <input
                  type="checkbox"
                  checked={permissions.can_edit}
                  onChange={() => togglePermission('can_edit')}
                />
                <span>Can edit tracks</span>
              </label>

              <label className="permission-item">
                <input
                  type="checkbox"
                  checked={permissions.can_download}
                  onChange={() => togglePermission('can_download')}
                />
                <span>Can download files</span>
              </label>

              <label className="permission-item">
                <input
                  type="checkbox"
                  checked={permissions.can_upload_audio}
                  onChange={() => togglePermission('can_upload_audio')}
                />
                <span>Can upload audio</span>
              </label>

              <label className="permission-item">
                <input
                  type="checkbox"
                  checked={permissions.can_upload_mixdown}
                  onChange={() => togglePermission('can_upload_mixdown')}
                />
                <span>Can upload mixdowns</span>
              </label>

              <label className="permission-item">
                <input
                  type="checkbox"
                  checked={permissions.can_comment}
                  onChange={() => togglePermission('can_comment')}
                />
                <span>Can comment</span>
              </label>

              <label className="permission-item">
                <input
                  type="checkbox"
                  checked={permissions.can_invite_others}
                  onChange={() => togglePermission('can_invite_others')}
                />
                <span>Can invite others</span>
              </label>
            </div>
          </div>

          {/* Role Descriptions */}
          <div className="role-description">
            <p className="role-desc-title">Role: {selectedRole}</p>
            <p className="role-desc-text">
              {selectedRole === 'viewer' && 'Can view and comment on tracks. Cannot edit or upload.'}
              {selectedRole === 'contributor' && 'Can upload audio tracks and edit project. Cannot upload mixdowns.'}
              {selectedRole === 'mixer' && 'Full editing rights including mixdown uploads. Cannot invite others.'}
              {selectedRole === 'admin' && 'Full permissions including inviting other collaborators.'}
            </p>
          </div>

          {error && <div className="error-message">{error}</div>}

          {/* Actions */}
          <div className="modal-actions">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? 'Sending...' : 'Send Invite'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
