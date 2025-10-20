// src/components/admin/UserAvatar.tsx
import Avatar from '../ui/Avatar';
import type { UserProfile } from '../../hooks/useUserData';

interface UserAvatarProps {
  user: UserProfile;
  size?: 'small' | 'medium' | 'large';
}

export default function UserAvatar({ user, size = 'medium' }: UserAvatarProps) {
  const initial = (user.full_name || user.username || user.email || '?').charAt(0).toUpperCase();
  const fullName = user.full_name || user.username || user.email || 'Unknown';

  return (
    <Avatar
      avatarUrl={user.avatar_url || null}
      initial={initial}
      fullName={fullName}
      size={size}
      shape="circle"
    />
  );
}