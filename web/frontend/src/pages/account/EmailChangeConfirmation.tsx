// src/pages/EmailChangeConfirmation.tsx
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Container from '../../components/layout/Container';
import Button from '../../components/ui/Button';
import { APP_FULL_NAME } from '../../lib/constants';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';

export default function EmailChangeConfirmation() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [countdown, setCountdown] = useState(10);
  const [newEmail, setNewEmail] = useState<string | null>(null);

  const handleContinueWithCurrentEmail = useCallback(() => {
    navigate('/settings');
  }, [navigate]);

  useEffect(() => {
    // Check URL parameters for new email
    const urlParams = new URLSearchParams(window.location.search);
    const emailParam = urlParams.get('new_email');
    setNewEmail(emailParam);

    // Auto-redirect countdown
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          handleContinueWithCurrentEmail();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [handleContinueWithCurrentEmail]);

  const handleLogoutAndUseNewEmail = async () => {
    try {
      await signOut();
      alert(`Bitte melden Sie sich mit Ihrer neuen Email-Adresse an: ${newEmail || 'neue Email'}`);
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      navigate('/login');
    }
  };

  const handleForceRefresh = async () => {
    try {
      // Force session refresh
      const { error } = await supabase.auth.refreshSession();
      if (error) {
        console.error('Refresh failed:', error);
      }
      
      // Force page reload
      window.location.reload();
    } catch (error) {
      console.error('Force refresh failed:', error);
      window.location.reload();
    }
  };

  return (
    <Container className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-xl p-8 text-center">
          {/* Success Icon */}
          <div className="mb-6">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-3xl">📧</span>
            </div>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Email-Änderung bestätigt!
            </h1>
            <p className="text-gray-600">
              Ihre Email-Änderung wurde erfolgreich bestätigt.
              {newEmail && (
                <>
                  <br />
                  <strong>Neue Email:</strong> {newEmail}
                </>
              )}
            </p>
          </div>

          {/* Current User Info */}
          {user && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg text-left">
              <p className="text-sm text-gray-600 mb-2">
                <strong>Aktuelle Session:</strong>
              </p>
              <p className="text-sm">
                <strong>Email:</strong> {user.email}
              </p>
              <p className="text-sm">
                <strong>User ID:</strong> {user.id.substring(0, 8)}...
              </p>
            </div>
          )}

          {/* Auto-redirect info */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">
              Automatische Weiterleitung in {countdown} Sekunden...
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              onClick={handleContinueWithCurrentEmail}
              className="w-full"
              variant="primary"
            >
              Mit aktueller Session fortfahren
            </Button>
            
            <Button
              onClick={handleLogoutAndUseNewEmail}
              variant="secondary"
              className="w-full"
            >
              Abmelden und mit neuer Email anmelden
            </Button>

            <Button
              onClick={handleForceRefresh}
              variant="outline"
              className="w-full"
            >
              🔄 Session aktualisieren
            </Button>
          </div>

          {/* Help Text */}
          <div className="mt-6 p-3 bg-yellow-50 rounded-lg">
            <p className="text-xs text-yellow-700">
              <strong>Hinweis:</strong> Falls Ihre neue Email nicht angezeigt wird, 
              loggen Sie sich aus und melden Sie sich mit der neuen Email an.
            </p>
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