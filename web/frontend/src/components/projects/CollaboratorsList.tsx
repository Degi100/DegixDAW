// ============================================
// COLLABORATORS LIST
// Display project collaborators with roles & permissions
// ============================================

import { useState } from 'react';
import Button from '../ui/Button';
import type { ProjectCollaborator } from '../../types/projects';

interface CollaboratorsListProps {
  collaborators: ProjectCollaborator[];
  currentUserId: string;
  projectOwnerId: string;
  onRemove: (collaboratorId: string) => Promise<void>;
  onUpdatePermissions: (collaboratorId: string, permissions: Partial<ProjectCollaborator>) => Promise<unknown>;
  onChangeRole?: (collaboratorId: string, newRole: string) => Promise<void>;
}

export default function CollaboratorsList({
  collaborators,
  currentUserId,
  projectOwnerId,
  onRemove,
  onChangeRole,
}: CollaboratorsListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [changingRoleId, setChangingRoleId] = useState<string | null>(null);

  const isOwner = currentUserId === projectOwnerId;

  const handleRoleChange = async (collaboratorId: string, newRole: string) => {
    if (!onChangeRole) return;
    setChangingRoleId(collaboratorId);
    try {
      await onChangeRole(collaboratorId, newRole);
    } finally {
      setChangingRoleId(null);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner': return 'badge-gold';
      case 'admin': return 'badge-red';
      case 'mixer': return 'badge-purple';
      case 'contributor': return 'badge-blue';
      case 'viewer': return 'badge-gray';
      default: return 'badge-gray';
    }
  };

  const getStatusBadge = (collaborator: ProjectCollaborator) => {
    if (!collaborator.accepted_at) {
      return <span className="badge badge-yellow">Pending</span>;
    }
    return null;
  };

  const toggleExpanded = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="collaborators-list">
      <div className="collaborators-header">
        <h3>Collaborators ({collaborators.length})</h3>
      </div>

      <div className="collaborators-grid">
        {collaborators.map((collab) => {
          const isExpanded = expandedId === collab.id;
          const canEdit = isOwner || currentUserId === collab.user_id;

          return (
            <div key={collab.id} className={`collaborator-card ${isExpanded ? 'expanded' : ''}`}>
              {/* Header */}
              <div className="collaborator-header" onClick={() => toggleExpanded(collab.id)}>
                <div className="collaborator-info">
                  <div className="collaborator-avatar">
                    {collab.avatar_url ? (
                      <img src={collab.avatar_url} alt={collab.username || 'User'} />
                    ) : (
                      <div className="avatar-placeholder">
                        {(collab.username || collab.email || '?')[0].toUpperCase()}
                      </div>
                    )}
                  </div>

                  <div className="collaborator-details">
                    <div className="collaborator-name">
                      {collab.username || collab.email || 'Unknown User'}
                    </div>
                    <div className="collaborator-badges">
                      <span className={`badge ${getRoleBadgeColor(collab.role)}`}>
                        {collab.role}
                      </span>
                      {getStatusBadge(collab)}
                    </div>
                  </div>
                </div>

                <button className="expand-btn" type="button">
                  {isExpanded ? '▲' : '▼'}
                </button>
              </div>

              {/* Expanded Permissions */}
              {isExpanded && (
                <div className="collaborator-permissions">
                  <div className="permissions-list">
                    <PermissionBadge
                      label="Edit Tracks"
                      enabled={collab.can_edit}
                    />
                    <PermissionBadge
                      label="Download"
                      enabled={collab.can_download}
                    />
                    <PermissionBadge
                      label="Upload Audio"
                      enabled={collab.can_upload_audio}
                    />
                    <PermissionBadge
                      label="Upload Mixdown"
                      enabled={collab.can_upload_mixdown}
                    />
                    <PermissionBadge
                      label="Comment"
                      enabled={collab.can_comment}
                    />
                    <PermissionBadge
                      label="Invite Others"
                      enabled={collab.can_invite_others}
                    />
                  </div>

                  {/* Role Change (Only for Owner/Admin) */}
                  {isOwner && collab.user_id !== projectOwnerId && onChangeRole && (
                    <div className="role-change-section">
                      <label htmlFor={`role-${collab.id}`} className="role-label">
                        Change Role:
                      </label>
                      <select
                        id={`role-${collab.id}`}
                        value={collab.role}
                        onChange={(e) => handleRoleChange(collab.id, e.target.value)}
                        disabled={changingRoleId === collab.id}
                        className="role-select"
                      >
                        <option value="viewer">Viewer</option>
                        <option value="contributor">Contributor</option>
                        <option value="mixer">Mixer</option>
                        <option value="admin">Admin</option>
                      </select>
                      {changingRoleId === collab.id && (
                        <span className="role-changing">Updating...</span>
                      )}
                    </div>
                  )}

                  {/* Metadata */}
                  <div className="collaborator-meta">
                    {collab.role !== 'owner' && collab.invited_at && (
                      <p className="meta-item">
                        <span className="meta-label">Invited:</span>
                        {new Date(collab.invited_at).toLocaleDateString()}
                      </p>
                    )}
                    {collab.accepted_at && (
                      <p className="meta-item">
                        <span className="meta-label">Joined:</span>
                        {new Date(collab.accepted_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  {canEdit && collab.user_id !== projectOwnerId && (
                    <div className="collaborator-actions">
                      {isOwner && (
                        <Button
                          variant="error"
                          size="small"
                          onClick={() => onRemove(collab.id)}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Helper: Permission Badge
function PermissionBadge({ label, enabled }: { label: string; enabled: boolean }) {
  return (
    <div className={`permission-badge ${enabled ? 'enabled' : 'disabled'}`}>
      <span className="permission-icon">{enabled ? '✓' : '✕'}</span>
      <span className="permission-label">{label}</span>
    </div>
  );
}
