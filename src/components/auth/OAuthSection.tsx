// src/components/ui/OAuthSection.tsx
import Button from '../ui/Button';
import styles from './OAuthSection.module.css';

interface OAuthSectionProps {
  onOAuthLogin: (provider: 'google' | 'discord') => Promise<void>;
}

export default function OAuthSection({ onOAuthLogin }: OAuthSectionProps) {
  const handleGoogleLogin = async () => {
    await onOAuthLogin('google');
  };

  const handleDiscordLogin = async () => {
    await onOAuthLogin('discord');
  };

  return (
    <div className={styles.oauthSection}>
      <p className={styles.oauthTitle}>
        Oder schnell anmelden mit:
      </p>
      
      <div className={styles.buttonGroup}>
        <Button 
          onClick={handleGoogleLogin}
          variant="google"
        >
          Mit Google anmelden
        </Button>
        
        <Button 
          onClick={handleDiscordLogin}
          variant="discord"
        >
          Mit Discord anmelden
        </Button>
      </div>
    </div>
  );
}