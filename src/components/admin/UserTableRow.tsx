// src/components/admin/UserTableRow.tsx
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
          <Button size="small" variant="outline" onClick={onEdit}>
            ✏️ Edit
          </Button>
          <Button
            size="small"
            variant="outline"
            onClick={onDelete}
            style={{ color: '#dc3545', borderColor: '#dc3545' }}
          >
            🗑️ Delete
          </Button>
        </div>
      </td>
    </tr>
  );
}