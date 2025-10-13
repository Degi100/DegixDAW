// src/pages/admin/components/modals/UserDeleteModal.tsx
// Delete User Confirmation Modal

import { useMemo } from 'react';
import Button from '../../../../components/ui/Button';
import type { UserDeleteModalProps } from '../../types/admin.types';

export default function UserDeleteModal({
  isOpen,
  onClose,
  user,
  onDeleteUser
}: UserDeleteModalProps) {
  // Check if this user is the super admin (protected)
  const isSuperAdmin = useMemo(() => {
    const superAdminEmail = import.meta.env.VITE_SUPER_ADMIN_EMAIL;
    return user.email === superAdminEmail;
  }, [user.email]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>🗑️ Delete User</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          {isSuperAdmin ? (
            <>
              <p style={{ color: '#ffc107', marginBottom: '1rem' }}>
                🛡️ <strong>Super Admin Protection</strong>
              </p>
              <p>The Super Admin account cannot be deleted. This is a security measure to prevent accidental removal of the system administrator.</p>
              <div className="user-delete-info" style={{ opacity: 0.7 }}>
                <strong>{user.full_name || user.username || 'Unnamed User'}</strong>
                <br />
                <small>{user.email}</small>
              </div>
            </>
          ) : (
            <>
              <p>Are you sure you want to delete this user?</p>
              <div className="user-delete-info">
                <strong>{user.full_name || user.username || 'Unnamed User'}</strong>
                <br />
                <small>{user.email}</small>
              </div>
              <p style={{ color: '#dc3545', marginTop: '1rem' }}>
                <strong>Warning:</strong> This action cannot be undone. The user will be permanently removed from the system.
              </p>
            </>
          )}
        </div>

        <div className="modal-footer">
          <Button variant="outline" onClick={onClose}>
            {isSuperAdmin ? 'Close' : 'Cancel'}
          </Button>
          {!isSuperAdmin && (
            <Button
              variant="primary"
              onClick={onDeleteUser}
              style={{ backgroundColor: '#dc3545', borderColor: '#dc3545' }}
            >
              Delete User
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
