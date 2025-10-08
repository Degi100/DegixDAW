// src/components/admin/UserTableRow.tsx
import { useMemo } from 'react';
import type { UserProfile } from '../../hooks/useUserData';
import UserAvatar from './UserAvatar';
import StatusBadge from './StatusBadge';
import Button from '../ui/Button';

interface UserTableRowProps {
  user: UserProfile;
  isSelected: boolean;
  onSelectChange: (selected: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
  formatDate: (dateString: string) => string;
}

export default function UserTableRow({
  user,
  isSelected,
  onSelectChange,
  onEdit,
  onDelete,
  formatDate
}: UserTableRowProps) {
  // Check if this user is the super admin (protected)
  const isSuperAdmin = useMemo(() => {
    const superAdminEmail = import.meta.env.VITE_SUPER_ADMIN_EMAIL;
    return user.email === superAdminEmail;
  }, [user.email]);

  return (
    <tr className={isSelected ? 'selected' : ''}>
      <td>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => onSelectChange(e.target.checked)}
        />
      </td>
      <td className="user-info-cell">
        <div className="flex items-center gap-3">
          <UserAvatar user={user} size="small" />
          <div className="user-details">
            <div className="user-name">
              {user.full_name || user.username || 'Unnamed User'}
            </div>
            <div className="user-username">
              {user.username ? `@${user.username}` : 'No username'}
            </div>
          </div>
        </div>
      </td>
      <td className="user-contact">
        <div className="user-email">{user.email}</div>
        {user.phone && <div className="user-phone">{user.phone}</div>}
      </td>
      <td>
        <StatusBadge user={user} type="role" />
      </td>
      <td className="user-status">
        <StatusBadge user={user} type="status" />
      </td>
      <td className="user-created">
        <div className="date-info">
          <div className="date-primary">{formatDate(user.created_at).split(' ')[0]}</div>
          <div className="date-secondary">{formatDate(user.created_at).split(' ')[1]}</div>
        </div>
      </td>
      <td className="user-last-login">
        {user.last_sign_in_at ? (
          <div className="date-info">
            <div className="date-primary">{formatDate(user.last_sign_in_at).split(' ')[0]}</div>
            <div className="date-secondary">{formatDate(user.last_sign_in_at).split(' ')[1]}</div>
          </div>
        ) : (
          <span className="never-logged-in">Never</span>
        )}
      </td>
      <td className="user-actions">
        <div className="action-buttons">
          <Button
            size="small"
            variant="outline"
            onClick={onEdit}
            disabled={isSuperAdmin}
            title={isSuperAdmin ? 'Super Admin role cannot be changed' : 'Edit user'}
          >
            ✏️ Edit
          </Button>
          <Button
            size="small"
            variant="outline"
            onClick={onDelete}
            disabled={isSuperAdmin}
            style={{ color: '#dc3545', borderColor: '#dc3545' }}
            title={isSuperAdmin ? 'Super Admin cannot be deleted' : 'Delete user'}
          >
            🗑️ Delete
          </Button>
        </div>
        {isSuperAdmin && (
          <small style={{ color: '#ffc107', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
            🛡️ Protected
          </small>
        )}
      </td>
    </tr>
  );
}