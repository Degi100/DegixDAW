// ============================================
// AUTH LANDING PAGE
// Corporate Theme - Landing Page for Authentication
// ============================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { useTheme } from '../../hooks/useTheme';
import { LoadingOverlay } from '../../components/ui/Loading';
import { APP_CONFIG } from '../../lib/constants';
import { supabase } from '../../lib/supabase';

// Import modular components
import AuthHeader from './components/AuthHeader';
import AuthHero from './components/AuthHero';
import AuthLoginForm from './components/AuthLoginForm';
import AuthRegisterForm from './components/AuthRegisterForm';

// Import types
import type { 
  LoginFormData, 
  RegisterFormData, 
  OAuthProvider 
} from './types/auth.types';

export default function AuthLanding() {
  const navigate = useNavigate();
  const { user, loading, signInWithEmail, signUpWithEmail, signInWithOAuth } = useAuth();
  const { success, error: showError } = useToast();
  const { isDark, toggleTheme } = useTheme();

  // Auth states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRegisterForm, setShowRegisterForm] = useState(false);

  // Login form data
  const [loginData, setLoginData] = useState<LoginFormData>({
    email: '',
    password: ''
  });

  // Register form data
  const [registerData, setRegisterData] = useState<RegisterFormData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  // Redirect if already logged in
  useEffect(() => {
    if (user && !loading) {
      // Check if user needs onboarding before redirecting to dashboard
      const checkOnboarding = async () => {
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('username')
            .eq('user_id', user.id)
            .single();
          
          if (!profile) {
            // No profile found - user needs onboarding
            navigate('/onboarding/username');
          } else {
            // Profile exists - user is already onboarded
            navigate('/dashboard');
          }
        } catch (error) {
          console.warn('Error checking profile for onboarding:', error);
          // If we can't check the profile, assume user needs onboarding for safety
          navigate('/onboarding/username');
        }
      };
      
      checkOnboarding();
    }
  }, [user, loading, navigate]);

  // Show loading while checking auth state
  if (loading) {
    return <LoadingOverlay />;
  }

  // Don't render if user is logged in (will redirect)
  if (user) {
    return null;
  }

  // ============================================
  // EVENT HANDLERS
  // ============================================

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const result = await signInWithEmail(loginData.email, loginData.password);

      if (result.success) {
        // Welcome message wird von useWelcomeMessage Hook angezeigt
        navigate('/dashboard');
      } else {
        showError(result.error?.message || 'Login failed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      showError(`Login failed: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate passwords match
    if (registerData.password !== registerData.confirmPassword) {
      showError('Passwords do not match');
      return;
    }

    // Validate required fields
    if (!registerData.firstName.trim() || !registerData.lastName.trim()) {
      showError('First name and last name are required');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await signUpWithEmail({
        email: registerData.email,
        password: registerData.password,
        fullName: `${registerData.firstName.trim()} ${registerData.lastName.trim()}`,
        username: registerData.email.split('@')[0] // Simple username generation
      });

      if (result.success) {
        success('Account created successfully! Please check your email to confirm your account.');
        setShowRegisterForm(false);
        setRegisterData({
          firstName: '',
          lastName: '',
          email: '',
          password: '',
          confirmPassword: ''
        });
      } else {
        showError(result.error?.message || 'Registration failed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      showError(`Registration failed: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOAuthLogin = async (provider: OAuthProvider) => {
    try {
      const result = await signInWithOAuth(provider);
      if (!result.success) {
        showError(result.error?.message || `${provider} login failed`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      showError(`${provider} login failed: ${errorMessage}`);
    }
  };

  const handleLoginInputChange = (field: keyof LoginFormData, value: string) => {
    setLoginData(prev => ({ ...prev, [field]: value }));
  };

  const handleRegisterInputChange = (field: keyof RegisterFormData, value: string) => {
    setRegisterData(prev => ({ ...prev, [field]: value }));
  };

  const handleForgotPassword = () => {
    navigate('/auth/forgot-password');
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="auth-landing">
      <AuthHeader
        onThemeToggle={toggleTheme}
        isDark={isDark}
        appName={APP_CONFIG.name}
        appSubtitle="Professional Digital Audio Workstation"
      />

      <main className="auth-main">
        <div className="auth-container">
          <AuthHero
            title="Welcome to the Future of Music Production"
            subtitle="Professional-grade digital audio workstation with industry-leading tools and ultra-low latency performance."
          />

          <div className="auth-form-section">
            {!showRegisterForm ? (
              <AuthLoginForm
                loginData={loginData}
                isSubmitting={isSubmitting}
                onSubmit={handleLogin}
                onInputChange={handleLoginInputChange}
                onOAuthLogin={handleOAuthLogin}
                onSwitchToRegister={() => setShowRegisterForm(true)}
                onForgotPassword={handleForgotPassword}
              />
            ) : (
              <AuthRegisterForm
                registerData={registerData}
                isSubmitting={isSubmitting}
                onSubmit={handleRegister}
                onInputChange={handleRegisterInputChange}
                onSwitchToLogin={() => setShowRegisterForm(false)}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
