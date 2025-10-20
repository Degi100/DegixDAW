// src/components/ui/ProfileInfo.tsx
import type { User } from '@supabase/supabase-js';
import { useAvatar } from '../../hooks/useAvatar';
import Avatar from '../ui/Avatar';

interface ProfileInfoProps {
  user: User;
}

export default function ProfileInfo({ user }: ProfileInfoProps) {
  const username = user.user_metadata?.username;
  const displayName = user.user_metadata?.full_name || username || 'Unbenannter Benutzer';
  const avatar = useAvatar(user);

  return (
    <section className="card card-large">
      <div className="account-info">
        <Avatar {...avatar} size="xlarge" shape="rounded" />
        <div className="profile-details">
          {username && (
            <h2 className="profile-name">@{username}</h2>
          )}
          {displayName && (
            <p className="profile-email">{displayName}</p>
          )}
          <p className="profile-email">{user.email}</p>
        </div>
      </div>
    </section>
  );
}