// ============================================
// PENDING INVITES COMPONENT
// Shows user's pending project invitations
// ============================================

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserPendingInvites, acceptInvite, removeCollaborator } from '../../lib/services/projects/collaboratorsService';
import Button from '../ui/Button';
import type { ProjectCollaborator } from '../../types/projects';

export default function PendingInvites() {
  const navigate = useNavigate();
  const [invites, setInvites] = useState<ProjectCollaborator[]>([]);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState<string | null>(null);

  useEffect(() => {
    loadInvites();
  }, []);

  const loadInvites = async () => {
    setLoading(true);
    const data = await getUserPendingInvites();
    setInvites(data);
    setLoading(false);
  };

  const handleAccept = async (inviteId: string, projectId: string) => {
    setAccepting(inviteId);
    const success = await acceptInvite(inviteId);
    if (success) {
      setInvites((prev) => prev.filter((inv) => inv.id !== inviteId));
      // Navigate to the project after accepting
      setTimeout(() => {
        navigate(`/projects/${projectId}`);
      }, 500); // Small delay for UX
    }
    setAccepting(null);
  };

  const handleReject = async (inviteId: string) => {
    if (!confirm('Reject this invitation?')) return;
    const success = await removeCollaborator(inviteId);
    if (success) {
      setInvites((prev) => prev.filter((inv) => inv.id !== inviteId));
    }
  };

  if (loading) {
    return (
      <div className="pending-invites loading">
        <p>Loading invites...</p>
      </div>
    );
  }

  if (invites.length === 0) {
    return null; // Don't show component if no invites
  }

  return (
    <div className="pending-invites">
      <div className="invites-header">
        <h3>Pending Invitations ({invites.length})</h3>
      </div>

      <div className="invites-list">
        {invites.map((invite) => (
          <div key={invite.id} className="invite-card">
            <div className="invite-info">
              <h4 className="project-title">
                {/* @ts-ignore - Joined from projects */}
                {invite.projects?.title || 'Unknown Project'}
              </h4>
              <div className="invite-details">
                <span className="role-badge badge-blue">{invite.role}</span>
                {invite.invited_at && (
                  <span className="invite-date">
                    Invited {new Date(invite.invited_at).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>

            <div className="invite-actions">
              <Button
                variant="success"
                size="small"
                onClick={() => handleAccept(invite.id, invite.project_id)}
                disabled={accepting === invite.id}
              >
                {accepting === invite.id ? 'Accepting...' : '✓ Accept'}
              </Button>
              <Button
                variant="secondary"
                size="small"
                onClick={() => handleReject(invite.id)}
                disabled={accepting === invite.id}
              >
                ✕ Reject
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
