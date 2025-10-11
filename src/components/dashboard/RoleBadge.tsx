// src/components/dashboard/RoleBadge.tsx
// Role Badge Component - Displays user's role with appropriate styling

import { useAdmin } from '../../hooks/useAdmin';

interface RoleBadgeProps {
  className?: string;
}

export default function RoleBadge({ className = '' }: RoleBadgeProps) {
  const { isSuperAdmin, isAdmin, isModerator, isBetaUser } = useAdmin();

  // Determine role display
  let roleLabel = '👤 User';
  let roleClass = 'role-user';

  if (isSuperAdmin) {
    roleLabel = '🛡️ Super Admin';
    roleClass = 'role-super-admin';
  } else if (isAdmin) {
    roleLabel = '⚡ Admin';
    roleClass = 'role-admin';
  } else if (isModerator) {
    roleLabel = '🔧 Moderator';
    roleClass = 'role-moderator';
  } else if (isBetaUser) {
    roleLabel = '🧪 Beta User';
    roleClass = 'role-beta';
  }

  return (
    <div className={`role-badge ${roleClass} ${className}`}>
      <span className="role-badge__label">🏷️ Rolle:</span>
      <span className="role-badge__value">{roleLabel}</span>
    </div>
  );
}
