// src/components/ui/ProfileInfo.tsx
import type { User } from '@supabase/supabase-js';

interface ProfileInfoProps {
  user: User;
}

export default function ProfileInfo({ user }: ProfileInfoProps) {
  const displayName = user.user_metadata?.full_name || 'Unbenannter Benutzer';
  const avatarLetter = displayName.charAt(0).toUpperCase();

  return (
    <section className="card card-large">
      <div className="account-info">
        <div className="avatar avatar-large">
          <span>{avatarLetter}</span>
        </div>
        <div className="profile-details">
          <h2 className="profile-name">{displayName}</h2>
          <p className="profile-email">{user.email}</p>
          {user.user_metadata?.username && (
            <p className="profile-email">@{user.user_metadata.username}</p>
          )}
        </div>
      </div>
    </section>
  );
}