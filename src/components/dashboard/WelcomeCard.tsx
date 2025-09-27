// src/components/ui/WelcomeCard.tsx
import type { User } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '../../hooks/useAdmin';
import Button from '../ui/Button';

interface WelcomeCardProps {
  user: User;
  onNavigateToSettings: () => void;
  onLogout: () => void;
}

export default function WelcomeCard({ user, onNavigateToSettings, onLogout }: WelcomeCardProps) {
  const navigate = useNavigate();
  const { isAdmin } = useAdmin();

  const handleAdminPanel = () => {
    navigate('/admin');
  };

  return (
    <section className="user-section">
      <div className="card card-large center">
        <h1 className="welcome-username">{user.user_metadata?.username ? `@${user.user_metadata.username}` : 'Kein Username'}</h1>
        <h3 className="welcome-name">{user.user_metadata?.full_name || 'Kein Name'}</h3>
        <div className="user-info">
          <p><strong>Email:</strong> {user.email}</p>
        </div>
        <div className="button-group">
          {isAdmin && (
            <Button 
              onClick={handleAdminPanel}
              variant="success"
            >
              🛡️ Admin Panel
            </Button>
          )}
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