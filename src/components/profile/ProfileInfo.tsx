// src/components/ui/ProfileInfo.tsx
import type { User } from '@supabase/supabase-js';
import styles from './ProfileInfo.module.css';

interface ProfileInfoProps {
  user: User;
}

export default function ProfileInfo({ user }: ProfileInfoProps) {
  const displayName = user.user_metadata?.full_name || 'Unbenannter Benutzer';
  const avatarLetter = displayName.charAt(0).toUpperCase();

  return (
    <section className={styles.infoCard}>
      <div className={styles.accountInfo}>
        <div className={styles.avatar}>
          <span className={styles.avatarText}>{avatarLetter}</span>
        </div>
        <div className={styles.accountDetails}>
          <h2 className={styles.accountName}>{displayName}</h2>
          <p className={styles.accountEmail}>{user.email}</p>
          {user.user_metadata?.username && (
            <p className={styles.accountUsername}>@{user.user_metadata.username}</p>
          )}
        </div>
      </div>
    </section>
  );
}