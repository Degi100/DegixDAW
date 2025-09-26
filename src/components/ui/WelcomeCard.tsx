// src/components/ui/WelcomeCard.tsx
import type { User } from '@supabase/supabase-js';
import Button from './Button';
import styles from './WelcomeCard.module.css';

interface WelcomeCardProps {
  user: User;
  onNavigateToSettings: () => void;
  onLogout: () => void;
}

export default function WelcomeCard({ user, onNavigateToSettings, onLogout }: WelcomeCardProps) {
  return (
    <section className={styles.userSection}>
      <div className={styles.welcomeCard}>
        <h2 className={styles.welcomeTitle}>Willkommen zurück!</h2>
        <div className={styles.userInfo}>
          <p><strong>Email:</strong> {user.email}</p>
          {user.user_metadata?.full_name && (
            <p><strong>Name:</strong> {user.user_metadata.full_name}</p>
          )}
          {user.user_metadata?.username && (
            <p><strong>Username:</strong> @{user.user_metadata.username}</p>
          )}
        </div>
        
        <div className={styles.actionButtons}>
          <Button 
            onClick={onNavigateToSettings}
            variant="primary"
          >
            ⚙️ Einstellungen
          </Button>
          <Button 
            onClick={onLogout}
            variant="outline"
          >
            👋 Abmelden
          </Button>
        </div>
      </div>
    </section>
  );
}