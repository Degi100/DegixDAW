// src/pages/admin/components/modals/UserEditModal.tsx
// Edit Existing User Modal

import { useState, useEffect, useMemo } from 'react';
import Button from '../../../../components/ui/Button';
import { useAuth } from '../../../../hooks/useAuth';
import type { UserEditModalProps } from '../../types/admin.types';
import type { UserProfile } from '../../../../hooks/useUserData';

export default function UserEditModal({
  isOpen,
  onClose,
  user,
  onUpdateUser
}: UserEditModalProps) {
  const [editedUser, setEditedUser] = useState<UserProfile>(user);
  const { user: currentUser } = useAuth();

  // Check if this user is the super admin (protected)
  const isSuperAdmin = useMemo(() => {
    const superAdminEmail = import.meta.env.VITE_SUPER_ADMIN_EMAIL;
    return user.email === superAdminEmail;
  }, [user.email]);

  // Check if editing self (prevent self-demotion)
  const isEditingSelf = useMemo(() => {
    return currentUser?.id === user.id;
  }, [currentUser?.id, user.id]);

  // Check if trying to demote self
  const isSelfDemotion = useMemo(() => {
    if (!isEditingSelf) return false;
    const currentRole = user.role;
    const newRole = editedUser.role;

    const roleHierarchy = { admin: 3, moderator: 2, user: 1 };
    const currentLevel = roleHierarchy[currentRole as keyof typeof roleHierarchy] || 0;
    const newLevel = roleHierarchy[newRole as keyof typeof roleHierarchy] || 0;

    return newLevel < currentLevel;
  }, [isEditingSelf, user.role, editedUser.role]);

  // Update local state when user prop changes
  useEffect(() => {
    setEditedUser(user);
  }, [user]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    // Prevent self-demotion
    if (isSelfDemotion) {
      alert('⚠️ You cannot demote yourself. Ask another admin to change your role.');
      return;
    }

    await onUpdateUser(editedUser);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>✏️ Edit User</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          <div className="form-grid">
            <div className="form-group">
              <label>Email (read-only)</label>
              <input type="email" value={editedUser.email} disabled />
            </div>
            
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                value={editedUser.full_name || ''}
                onChange={(e) => setEditedUser({ ...editedUser, full_name: e.target.value })}
                placeholder="John Doe"
              />
            </div>
            
            <div className="form-group">
              <label>Username</label>
              <input
                type="text"
                value={editedUser.username || ''}
                onChange={(e) => setEditedUser({ ...editedUser, username: e.target.value })}
                placeholder="johndoe"
              />
            </div>
            
            <div className="form-group">
              <label>Role</label>
              <select
                value={editedUser.role || 'user'}
                onChange={(e) => setEditedUser({ ...editedUser, role: e.target.value as 'admin' | 'user' | 'moderator' | 'beta_user' })}
                disabled={isSuperAdmin}
              >
                <option value="user">User</option>
                <option value="beta_user">🧪 Beta Tester</option>
                <option value="moderator">Moderator</option>
                <option value="admin">Admin</option>
              </select>
              {isSuperAdmin && (
                <small style={{ color: '#6c757d', marginTop: '0.25rem', display: 'block' }}>
                  🛡️ Super Admin role cannot be changed
                </small>
              )}
              {isSelfDemotion && (
                <small style={{ color: '#dc3545', marginTop: '0.25rem', display: 'block' }}>
                  ⚠️ You cannot demote yourself
                </small>
              )}
            </div>
            
            <div className="form-group">
              <label>Phone</label>
              <input
                type="tel"
                value={editedUser.phone || ''}
                onChange={(e) => setEditedUser({ ...editedUser, phone: e.target.value })}
                placeholder="+49 123 456789"
              />
            </div>
            
            <div className="form-group">
              <label>Status</label>
              <select
                value={editedUser.is_active === false ? 'inactive' : 'active'}
                onChange={(e) => setEditedUser({ ...editedUser, is_active: e.target.value === 'active' })}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>
        
        <div className="modal-footer">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit}>
            Update User
          </Button>
        </div>
      </div>
    </div>
  );
}
