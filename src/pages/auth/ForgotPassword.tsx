// src/pages/ForgotPassword.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import Container from '../../components/layout/Container';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { APP_FULL_NAME } from '../../lib/constants';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { resetPassword } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      error('Bitte geben Sie Ihre E-Mail-Adresse ein.');
      return;
    }

    setIsLoading(true);
    
    try {
      console.log('🔍 Recovery URL wird verwendet:', window.location.origin + '/auth/recover');
      const result = await resetPassword(email.trim());
      
      if (result.success) {
        setEmailSent(true);
        success('🔑 Password-Reset Link wurde gesendet! Überprüfen Sie Ihr Postfach.');
      } else {
        error(result.error?.message || 'Fehler beim Senden des Reset-Links.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <Container className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
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
                E-Mail gesendet!
              </h1>
              <p className="text-gray-600">
                Wir haben Ihnen eine E-Mail mit einem Link zum Zurücksetzen Ihres Passworts gesendet.
              </p>
              <p className="text-sm text-gray-500 mt-3">
                <strong>{email}</strong>
              </p>
            </div>

            {/* Instructions */}
            <div className="mb-6 p-4 bg-blue-50 rounded-lg text-left">
              <h3 className="font-medium text-blue-900 mb-2">Nächste Schritte:</h3>
              <ol className="text-sm text-blue-700 space-y-1">
                <li>1. Überprüfen Sie Ihr E-Mail-Postfach</li>
                <li>2. Klicken Sie auf den Reset-Link</li>
                <li>3. Geben Sie Ihr neues Passwort ein</li>
              </ol>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <Button
                onClick={() => navigate('/')}
                variant="outline"
                className="w-full"
              >
                ← Zurück zur Anmeldung
              </Button>
              
              <p className="text-xs text-gray-500">
                Keine E-Mail erhalten? <button 
                  onClick={() => setEmailSent(false)} 
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Erneut versuchen
                </button>
              </p>
            </div>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              🔑 Passwort vergessen?
            </h1>
            <p className="text-gray-600">
              Geben Sie Ihre E-Mail-Adresse ein und wir senden Ihnen einen Link 
              zum Zurücksetzen Ihres Passworts.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                E-Mail-Adresse
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ihre@email.de"
                required
                disabled={isLoading}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Wird gesendet...' : 'Reset-Link senden'}
            </Button>
          </form>

          {/* Navigation */}
          <div className="mt-6 pt-6 border-t border-gray-200 text-center space-y-3">
            <Button
              variant="outline"
              onClick={() => navigate('/')}
              className="text-sm"
            >
              ← Zurück zur Anmeldung
            </Button>
            
            <p className="text-xs text-gray-500">
              Haben Sie Ihr Passwort wieder? <button 
                onClick={() => navigate('/')} 
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Jetzt anmelden
              </button>
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

