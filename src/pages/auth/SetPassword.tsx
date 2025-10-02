// src/pages/auth/SetPassword.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../hooks/useToast';
import Container from '../../components/layout/Container';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { LoadingOverlay } from '../../components/ui/Loading';
import { APP_FULL_NAME } from '../../lib/constants';

export default function SetPassword() {
  const navigate = useNavigate();
  const { success, error: showError } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordData, setPasswordData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Check if user is logged in
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        navigate('/');
        return;
      }
      setIsLoading(false);
    };

    checkAuth();
  }, [navigate]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!passwordData.password) {
      newErrors.password = 'Passwort ist erforderlich';
    } else if (passwordData.password.length < 6) {
      newErrors.password = 'Passwort muss mindestens 6 Zeichen lang sein';
    }

    if (!passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Passwort-Bestätigung ist erforderlich';
    } else if (passwordData.password !== passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Passwörter stimmen nicht überein';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.password
      });

      if (error) throw error;

      success('🎉 Passwort erfolgreich gesetzt!');

      // Check if user needs onboarding
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('username')
          .eq('user_id', session.user.id)
          .single();

        if (!profile) {
          navigate('/onboarding/username');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (err) {
      console.error('Password set error:', err);
      showError('❌ Fehler beim Setzen des Passworts. Bitte versuchen Sie es erneut.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <LoadingOverlay message="Lade..." />;
  }

  return (
    <Container className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Passwort festlegen
            </h1>
            <p className="text-gray-600">
              Bitte legen Sie ein sicheres Passwort für Ihr {APP_FULL_NAME} Konto fest.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Neues Passwort"
              type="password"
              value={passwordData.password}
              onChange={(e) => setPasswordData(prev => ({ ...prev, password: e.target.value }))}
              placeholder="Mindestens 6 Zeichen"
              error={errors.password}
              disabled={isSubmitting}
              required
              showPasswordToggle={true}
            />

            <Input
              label="Passwort bestätigen"
              type="password"
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
              placeholder="Passwort wiederholen"
              error={errors.confirmPassword}
              disabled={isSubmitting}
              required
              showPasswordToggle={true}
            />

            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
              className="w-full"
            >
              {isSubmitting ? '⏳ Passwort wird gesetzt...' : '🔑 Passwort festlegen'}
            </Button>
          </form>
        </div>
      </div>
    </Container>
  );
}