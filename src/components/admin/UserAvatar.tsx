// src/components/admin/UserAvatar.tsx
import type { UserProfile } from '../../hooks/useUserData';

interface UserAvatarProps {
  user: UserProfile;
  size?: 'small' | 'medium' | 'large';
}

export default function UserAvatar({ user, size = 'medium' }: UserAvatarProps) {
  const sizeClasses = {
    small: 'w-8 h-8 text-sm',
    medium: 'w-10 h-10 text-base',
    large: 'w-12 h-12 text-lg'
  };

  return (
    <div className={`user-avatar ${sizeClasses[size]} rounded-full bg-gradient-to-br from-primary-500 to-primary-600 text-white flex items-center justify-center font-semibold flex-shrink-0`}>
      {(user.full_name || user.username || user.email).charAt(0).toUpperCase()}
    </div>
  );
}