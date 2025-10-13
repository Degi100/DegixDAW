// src/components/ui/OAuthSection.tsx
import Button from '../ui/Button';

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
    <div className="card card-medium center">
      <p className="text-secondary">
        Oder schnell anmelden mit:
      </p>
      
      <div className="button-group">
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