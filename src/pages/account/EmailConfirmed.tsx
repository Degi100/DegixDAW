// src/pages/EmailConfirmed.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Container from '../../components/layout/Container';
import Button from '../../components/ui/Button';
import { APP_FULL_NAME } from '../../lib/constants';
import { supabase } from '../../lib/supabase';

export default function EmailConfirmed() {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(10);
  const [redirectTarget, setRedirectTarget] = useState('/login');
  const [isEmailChange, setIsEmailChange] = useState(false);

  // Check if user needs onboarding and set redirect target
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      // Check URL params to see if this is an email change confirmation
      const urlParams = new URLSearchParams(window.location.search);
      const emailType = urlParams.get('type');
      
      if (emailType === 'email_change') {

        setIsEmailChange(true);
        setRedirectTarget('/settings');
        return;
      }
      
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const hasUsername = !!session.user.user_metadata?.username;
        const needsOnboarding = session.user.user_metadata?.needs_username_onboarding;
        
        // STRICT: Any user without username OR with onboarding flag goes to onboarding
        if (!hasUsername || needsOnboarding) {

          setRedirectTarget('/onboarding/username');
        } else {

          setRedirectTarget('/dashboard');
        }
      } else {
        // No session - redirect to login

        setRedirectTarget('/login');
      }
    };
    
    checkOnboardingStatus();
  }, []);

  // Auto-redirect after 10 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          navigate(redirectTarget);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate, redirectTarget]);

  const handleContinueNow = () => {
    navigate(redirectTarget);
  };

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <Container className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-xl p-8 text-center">
          {/* Success Icon */}
          <div className="mb-6">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-3xl">✅</span>
            </div>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {isEmailChange ? 'E-Mail geändert!' : 'E-Mail bestätigt!'}
            </h1>
            <p className="text-gray-600">
              {isEmailChange 
                ? 'Ihre E-Mail-Adresse wurde erfolgreich geändert.'
                : 'Ihre E-Mail-Adresse wurde erfolgreich bestätigt. Sie können sich jetzt anmelden.'
              }
            </p>
          </div>

          {/* Auto-redirect info */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">
              Automatische Weiterleitung in {countdown} Sekunden...
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              onClick={handleContinueNow}
              className="w-full"
              variant="primary"
            >
              {isEmailChange 
                ? 'Zu den Einstellungen' 
                : redirectTarget === '/onboarding/username' 
                  ? 'Username wählen' 
                  : 'Jetzt anmelden'
              }
            </Button>
            
            <Button
              onClick={handleGoHome}
              variant="outline"
              className="w-full"
            >
              Zur Startseite
            </Button>
          </div>
        </div>

        {/* App Info */}
        <div className="text-center mt-8 text-gray-500 text-sm">
          <p>{APP_FULL_NAME}</p>
        </div>
      </div>
    </Container>
  );
}