// src/pages/admin/components/modals/UserEditModal.tsx
// Edit Existing User Modal

import { useState, useEffect, useMemo } from 'react';
import Button from '../../../../components/ui/Button';
import { useAuth } from '../../../../hooks/useAuth';
import { ADMIN_ROUTES } from '../../../../lib/constants/adminRoutes';
import type { UserEditModalProps } from '../../types/admin.types';
import type { UserProfile } from '../../../../hooks/useUserData';

export default function UserEditModal({
  isOpen,
  onClose,
  user,
  onUpdateUser
}: UserEditModalProps) {
  const [editedUser, setEditedUser] = useState<UserProfile>(user);
  const [allowedRoutes, setAllowedRoutes] = useState<string[]>([]);
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

  // Show route permissions only for admin/moderator roles
  const showRoutePermissions = useMemo(() => {
    return editedUser.role === 'admin' || editedUser.role === 'moderator';
  }, [editedUser.role]);

  // Update local state when user prop changes
  useEffect(() => {
    setEditedUser(user);
    // Load allowed routes from user_metadata
    const routes = (user as any).user_metadata?.allowed_admin_routes || [];
    setAllowedRoutes(routes);
  }, [user]);

  const toggleRoute = (routeId: string) => {
    setAllowedRoutes(prev =>
      prev.includes(routeId)
        ? prev.filter(r => r !== routeId)
        : [...prev, routeId]
    );
  };

  if (!isOpen) return null;

  const handleSubmit = async () => {
    // Prevent self-demotion
    if (isSelfDemotion) {
      alert('⚠️ You cannot demote yourself. Ask another admin to change your role.');
      return;
    }

    // Include allowed_admin_routes in user_metadata
    const updatedUser = {
      ...editedUser,
      user_metadata: {
        ...(editedUser as any).user_metadata,
        allowed_admin_routes: showRoutePermissions ? allowedRoutes : []
      }
    };

    await onUpdateUser(updatedUser);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-content--large" onClick={(e) => e.stopPropagation()}>
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

          {/* Admin Route Permissions */}
          {showRoutePermissions && !isSuperAdmin && (
            <div className="form-group" style={{ marginTop: '1.5rem' }}>
              <label style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem', display: 'block' }}>
                🔐 Allowed Admin Routes
              </label>
              <small style={{ color: '#6c757d', marginBottom: '1rem', display: 'block' }}>
                Select which admin pages this user can access
              </small>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '0.75rem'
              }}>
                {ADMIN_ROUTES.map(route => (
                  <label
                    key={route.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.75rem',
                      border: '1px solid #dee2e6',
                      borderRadius: '0.375rem',
                      cursor: 'pointer',
                      backgroundColor: allowedRoutes.includes(route.id) ? '#e7f3ff' : 'transparent',
                      transition: 'all 0.2s'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={allowedRoutes.includes(route.id)}
                      onChange={() => toggleRoute(route.id)}
                      style={{ cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: '1.25rem' }}>{route.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{route.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#6c757d' }}>{route.description}</div>
                    </div>
                  </label>
                ))}
              </div>
              {allowedRoutes.length === 0 && (
                <small style={{ color: '#dc3545', marginTop: '0.5rem', display: 'block' }}>
                  ⚠️ No routes selected - user will not be able to access admin panel
                </small>
              )}
            </div>
          )}

          {isSuperAdmin && (
            <div style={{
              marginTop: '1.5rem',
              padding: '1rem',
              backgroundColor: '#f8f9fa',
              borderRadius: '0.375rem',
              border: '1px solid #dee2e6'
            }}>
              <strong>🛡️ Super Admin</strong>
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', color: '#6c757d' }}>
                Super Admins have access to all routes automatically
              </p>
            </div>
          )}
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
