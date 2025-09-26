// src/components/ui/WelcomeCard.tsx
import type { User } from '@supabase/supabase-js';
import Button from '../ui/Button';

interface WelcomeCardProps {
  user: User;
  onNavigateToSettings: () => void;
  onLogout: () => void;
}

export default function WelcomeCard({ user, onNavigateToSettings, onLogout }: WelcomeCardProps) {
  return (
    <section className="user-section">
      <div className="card card-large center">
        <h2 className="welcome-title">Willkommen zurück!</h2>
        <div className="user-info">
          <p><strong>Email:</strong> {user.email}</p>
          {user.user_metadata?.full_name && (
            <p><strong>Name:</strong> {user.user_metadata.full_name}</p>
          )}
          {user.user_metadata?.username && (
            <p><strong>Username:</strong> @{user.user_metadata.username}</p>
          )}
        </div>
        
        <div className="button-group">
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