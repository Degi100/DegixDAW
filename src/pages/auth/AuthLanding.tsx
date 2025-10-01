// ============================================
// AUTH LANDING PAGE
// Corporate Theme - Landing Page for Authentication
// ============================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { useTheme } from '../../hooks/useTheme';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { LoadingOverlay } from '../../components/ui/Loading';
import { APP_CONFIG } from '../../lib/constants';

export default function AuthLanding() {
  const navigate = useNavigate();
  const { user, loading, signInWithEmail, signUpWithEmail, signInWithOAuth } = useAuth();
  const { success, error: showError } = useToast();
  const { isDark, toggleTheme } = useTheme();

  // Auth states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRegisterForm, setShowRegisterForm] = useState(false);

  // Login form data
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });

  // Register form data
  const [registerData, setRegisterData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  // Redirect if already logged in
  useEffect(() => {
    if (user && !loading) {
      navigate('/dashboard');
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

  const handleThemeToggle = () => {
    toggleTheme();
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const result = await signInWithEmail(loginData.email, loginData.password);

      if (result.success) {
        success('Successfully logged in! 🎉');
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

  const handleOAuthLogin = async (provider: 'google' | 'discord') => {
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

  return (
    <div className="auth-landing">
      {/* Header */}
      <header className="auth-header">
        <div className="auth-header-content">
          <div className="auth-brand">
            <h1 className="auth-brand-title">🎛️ {APP_CONFIG.name}</h1>
            <p className="auth-brand-subtitle">Professional Digital Audio Workstation</p>
          </div>
        </div>

        {/* Theme Toggle - Same as authenticated header */}
        <button
          onClick={handleThemeToggle}
          className="theme-toggle"
          aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
        >
          <span className="theme-icon">
            {isDark ? '☀️' : '🌙'}
          </span>
        </button>
      </header>

      {/* Main Content */}
      <main className="auth-main">
        <div className="auth-container">
          {/* Hero Section */}
          <div className="auth-hero">
            <h2 className="auth-hero-title">
              Welcome to the Future of Music Production
            </h2>
            <p className="auth-hero-subtitle">
              Professional-grade digital audio workstation with industry-leading tools
              and ultra-low latency performance.
            </p>

            <div className="auth-features">
              <div className="auth-feature">
                <span className="feature-icon">⚡</span>
                <span>Ultra-Low Latency</span>
              </div>
              <div className="auth-feature">
                <span className="feature-icon">🎯</span>
                <span>Studio Quality</span>
              </div>
              <div className="auth-feature">
                <span className="feature-icon">🚀</span>
                <span>Professional Tools</span>
              </div>
            </div>
          </div>

          {/* Auth Form */}
          <div className="auth-form-section">
            {!showRegisterForm ? (
              <div className="auth-form-container">
                <h3 className="auth-form-title">Sign In</h3>
                <p className="auth-form-subtitle">Welcome back! Please sign in to your account.</p>

                <form onSubmit={handleLogin} className="auth-form">
                  <div className="form-group">
                    <Input
                      type="email"
                      label="Email"
                      value={loginData.email}
                      onChange={(e) => setLoginData(prev => ({ ...prev, email: e.target.value }))}
                      required
                      placeholder="your@email.com"
                    />
                  </div>

                  <div className="form-group">
                    <Input
                      type="password"
                      label="Password"
                      value={loginData.password}
                      onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                      required
                      placeholder="Your password"
                    />
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    fullWidth
                    disabled={isSubmitting}
                    className="auth-submit-btn"
                  >
                    {isSubmitting ? 'Signing In...' : 'Sign In'}
                  </Button>
                </form>

                <div className="auth-links">
                  <button
                    onClick={() => navigate('/auth/forgot-password')}
                    className="auth-link"
                  >
                    Forgot password?
                  </button>
                </div>

                <div className="auth-divider">
                  <span>or</span>
                </div>

                <div className="auth-oauth">
                  <Button
                    onClick={() => handleOAuthLogin('google')}
                    variant="outline"
                    fullWidth
                    className="oauth-btn google-btn"
                  >
                    <span className="oauth-icon">🌐</span>
                    Continue with Google
                  </Button>

                  <Button
                    onClick={() => handleOAuthLogin('discord')}
                    variant="outline"
                    fullWidth
                    className="oauth-btn discord-btn"
                  >
                    <span className="oauth-icon">💬</span>
                    Continue with Discord
                  </Button>
                </div>

                <div className="auth-switch">
                  <p>
                    Don't have an account?{' '}
                    <button
                      onClick={() => setShowRegisterForm(true)}
                      className="auth-switch-link"
                    >
                      Sign up
                    </button>
                  </p>
                </div>
              </div>
            ) : (
              <div className="auth-form-container">
                <h3 className="auth-form-title">Create Account</h3>
                <p className="auth-form-subtitle">Join our community of music producers.</p>

                <form onSubmit={handleRegister} className="auth-form">
                  <div className="form-row">
                    <div className="form-group">
                      <Input
                        label="First Name"
                        value={registerData.firstName}
                        onChange={(e) => setRegisterData(prev => ({ ...prev, firstName: e.target.value }))}
                        required
                        placeholder="John"
                      />
                    </div>
                    <div className="form-group">
                      <Input
                        label="Last Name"
                        value={registerData.lastName}
                        onChange={(e) => setRegisterData(prev => ({ ...prev, lastName: e.target.value }))}
                        required
                        placeholder="Doe"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <Input
                      type="email"
                      label="Email"
                      value={registerData.email}
                      onChange={(e) => setRegisterData(prev => ({ ...prev, email: e.target.value }))}
                      required
                      placeholder="your@email.com"
                    />
                  </div>

                  <div className="form-group">
                    <Input
                      type="password"
                      label="Password"
                      value={registerData.password}
                      onChange={(e) => setRegisterData(prev => ({ ...prev, password: e.target.value }))}
                      required
                      placeholder="Create a strong password"
                    />
                  </div>

                  <div className="form-group">
                    <Input
                      type="password"
                      label="Confirm Password"
                      value={registerData.confirmPassword}
                      onChange={(e) => setRegisterData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      required
                      placeholder="Confirm your password"
                    />
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    fullWidth
                    disabled={isSubmitting}
                    className="auth-submit-btn"
                  >
                    {isSubmitting ? 'Creating Account...' : 'Create Account'}
                  </Button>
                </form>

                <div className="auth-switch">
                  <p>
                    Already have an account?{' '}
                    <button
                      onClick={() => setShowRegisterForm(false)}
                      className="auth-switch-link"
                    >
                      Sign in
                    </button>
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}