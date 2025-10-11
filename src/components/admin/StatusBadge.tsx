// src/components/admin/StatusBadge.tsx
import type { UserProfile } from '../../hooks/useUserData';

interface StatusBadgeProps {
  user: UserProfile;
  type: 'status' | 'role';
}

export default function StatusBadge({ user, type }: StatusBadgeProps) {
  if (type === 'status') {
    const statusInfo = getStatusInfo(user);
    return (
      <span className={`status-badge ${statusInfo.class}`}>
        {statusInfo.text}
      </span>
    );
  }

  if (type === 'role') {
    const roleInfo = getRoleInfo(user.role);
    return (
      <span className={`status-badge ${roleInfo.class}`}>
        {roleInfo.text}
      </span>
    );
  }

  return null;
}

function getStatusInfo(user: UserProfile) {
  if (!user.profile_created_at) return { text: 'Pending', class: 'pending' };
  if (user.is_active === false) return { text: 'Inactive', class: 'inactive' };
  return { text: 'Active', class: 'active' };
}

function getRoleInfo(role?: string) {
  switch (role) {
    case 'admin': return { text: 'Admin', class: 'danger' };
    case 'moderator': return { text: 'Moderator', class: 'warning' };
    case 'beta_user': return { text: 'Beta Tester', class: 'info' };
    default: return { text: 'User', class: 'secondary' };
  }
}