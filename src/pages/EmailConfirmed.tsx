// src/pages/EmailConfirmed.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Container from '../components/layout/Container';
import Button from '../components/ui/Button';
import { APP_FULL_NAME } from '../lib/constants';

export default function EmailConfirmed() {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(10);

  // Auto-redirect after 10 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          navigate('/login');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  const handleLoginNow = () => {
    navigate('/login');
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
              E-Mail bestätigt!
            </h1>
            <p className="text-gray-600">
              Ihre E-Mail-Adresse wurde erfolgreich bestätigt. 
              Sie können sich jetzt anmelden.
            </p>
          </div>

          {/* Auto-redirect info */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">
              Automatische Weiterleitung zur Anmeldung in {countdown} Sekunden...
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              onClick={handleLoginNow}
              className="w-full"
              variant="primary"
            >
              Jetzt anmelden
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