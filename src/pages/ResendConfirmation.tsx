// src/pages/ResendConfirmation.tsx
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import Container from '../components/layout/Container';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { ToastContainer } from '../components/ui/Toast';
import { APP_FULL_NAME } from '../lib/constants';

export default function ResendConfirmation() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { resendConfirmation } = useAuth();
  const { success, error, toasts, removeToast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Get email from URL params if available
  const urlEmail = searchParams.get('email');
  useState(() => {
    if (urlEmail) {
      setEmail(urlEmail);
    }
  });

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      error('Bitte geben Sie Ihre E-Mail-Adresse ein.');
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await resendConfirmation(email.trim());
      
      if (result.success) {
        success('✅ Bestätigungs-E-Mail wurde erneut gesendet! Überprüfen Sie Ihr Postfach.');
      } else {
        error(result.error?.message || 'Fehler beim Senden der Bestätigungs-E-Mail.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              📧 E-Mail-Bestätigung
            </h1>
            <p className="text-gray-600">
              Ihr Bestätigungslink ist abgelaufen. Geben Sie Ihre E-Mail-Adresse ein, 
              um einen neuen Link zu erhalten.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleResend} className="space-y-6">
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
              {isLoading ? 'Wird gesendet...' : 'Bestätigungs-E-Mail erneut senden'}
            </Button>
          </form>

          {/* Navigation */}
          <div className="mt-6 pt-6 border-t border-gray-200 text-center space-y-3">
            <Button
              variant="outline"
              onClick={() => navigate('/login')}
              className="text-sm"
            >
              ← Zurück zur Anmeldung
            </Button>
            
            <p className="text-xs text-gray-500">
              Bereits bestätigt? <button 
                onClick={() => navigate('/login')} 
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

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </Container>
  );
}