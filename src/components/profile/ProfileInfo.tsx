// src/components/ui/ProfileInfo.tsx
import type { User } from '@supabase/supabase-js';

interface ProfileInfoProps {
  user: User;
}

export default function ProfileInfo({ user }: ProfileInfoProps) {
  const username = user.user_metadata?.username;
  const displayName = user.user_metadata?.full_name || username || 'Unbenannter Benutzer';
  const avatarLetter = (username || displayName).charAt(0).toUpperCase();

  return (
    <section className="card card-large">
      <div className="account-info">
        <div className="avatar avatar-large">
          <span>{avatarLetter}</span>
        </div>
        <div className="profile-details">
          {username && (
            <h2 className="profile-name">@{username}</h2>
          )}
          {user.user_metadata?.full_name && (
            <p className="profile-email">{user.user_metadata.full_name}</p>
          )}
          <p className="profile-email">{user.email}</p>
        </div>
      </div>
    </section>
  );
}