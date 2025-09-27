// src/pages/Login.corporate.tsx
// Ultimate Corporate Login Page with Professional Design

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { useTheme } from '../hooks/useTheme';
import AuthForm from '../components/auth/AuthForm';
import OAuthSection from '../components/auth/OAuthSection';
import ContinueSection from '../components/auth/ContinueSection';
import Button from '../components/ui/Button';
import { APP_FULL_NAME } from '../lib/constants';

export default function LoginCorporate() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isDark, toggleTheme } = useTheme();

  const { signInWithEmail, signUpWithEmail, signInWithOAuth } = useAuth();
  const { success, error: showError } = useToast();

  const handleThemeToggle = () => {
    toggleTheme();
    success(`Switched to ${isDark ? 'Light' : 'Dark'} mode! 🎨`);
  };

  const handleLogin = async (email: string, password: string) => {
    setIsSubmitting(true);
    try {
      const result = await signInWithEmail(email, password);
      
      if (result.success) {
        success('Successfully logged in! 🎉');
        navigate('/');
      } else {
        const errorMessage = result.error?.message || 'Login failed';
        
        // Check if it's an email confirmation issue
        if (result.error?.type === 'validation' && 
            (errorMessage.includes('abgelaufen') || errorMessage.includes('bestätigen'))) {
          // Redirect to resend confirmation page with email
          navigate(`/auth/resend-confirmation?email=${encodeURIComponent(email)}`);
          return;
        }
        
        showError(errorMessage);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      showError(`Login failed: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignup = async (data: {
    email: string;
    password: string;
    fullName: string;
    username: string;
  }) => {
    setIsSubmitting(true);
    try {
      const result = await signUpWithEmail(data);
      
      if (result.success) {
        success('Registration successful! Please check your email for confirmation.', {
          duration: 8000
        });
      } else {
        const errorMessage = result.error?.message || 'Registration failed';
        
        // Special handling for duplicate email
        if (result.error?.type === 'validation' && 
            errorMessage.includes('bereits registriert')) {
          // Show error with suggestion to login instead
          showError(errorMessage);
          
          // Auto-switch to login tab after a moment
          setTimeout(() => {
            document.querySelector('[data-tab="login"]')?.scrollIntoView({ behavior: 'smooth' });
          }, 3000);
        } else {
          showError(errorMessage);
        }
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      showError(`Registration failed: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOAuthLogin = async (provider: 'google' | 'discord') => {
    setIsSubmitting(true);
    try {
      const result = await signInWithOAuth(provider);
      
      if (!result.success) {
        showError(result.error?.message || `${provider} Login failed`);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      showError(`${provider} Login failed: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContinueWithoutLogin = () => {
    navigate('/');
  };

  return (
    <div className="login-corporate">
      {/* Corporate Header */}
      <header className="login-header">
        <div className="login-header-content">
          <div className="brand-section">
            <h1 className="brand-title">🎛️ {APP_FULL_NAME}</h1>
            <p className="brand-subtitle">
              Professional Digital Audio Workstation Platform
            </p>
          </div>
          
          <div className="header-actions">
            <Button
              onClick={handleThemeToggle}
              variant="outline"
              size="small"
              className="theme-toggle-btn"
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDark ? '☀️' : '🌙'}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Login Content */}
      <main className="login-main">
        <div className="login-container">
          
          {/* Hero Section */}
          <div className="login-hero">
            <div className="hero-content">
              <h2 className="hero-title">Welcome Back</h2>
              <p className="hero-subtitle">
                Sign in to continue your musical journey with professional-grade tools
              </p>
              
              {/* Feature Highlights */}
              <div className="feature-highlights">
                <div className="highlight-item">
                  <span className="highlight-icon">🎵</span>
                  <span className="highlight-text">Professional Audio Engine</span>
                </div>
                <div className="highlight-item">
                  <span className="highlight-icon">☁️</span>
                  <span className="highlight-text">Cloud Collaboration</span>
                </div>
                <div className="highlight-item">
                  <span className="highlight-icon">🎹</span>
                  <span className="highlight-text">Virtual Instruments</span>
                </div>
              </div>
            </div>
            
            {/* Visual Elements */}
            <div className="hero-visual">
              <div className="visual-cards">
                <div className="visual-card pulse">🎸</div>
                <div className="visual-card pulse-delay">🥁</div>
                <div className="visual-card pulse">🎹</div>
                <div className="visual-card pulse-delay">🎤</div>
              </div>
            </div>
          </div>

          {/* Authentication Forms */}
          <div className="auth-section">
            <div className="auth-card">
              <div className="auth-header">
                <h3 className="auth-title">Get Started</h3>
                <p className="auth-subtitle">Choose your preferred way to access the platform</p>
              </div>
              
              <div className="auth-content">
                <AuthForm 
                  onLogin={handleLogin}
                  onSignup={handleSignup}
                  isSubmitting={isSubmitting}
                />
                
                <div className="auth-divider">
                  <span className="divider-text">or continue with</span>
                </div>
                
                <OAuthSection onOAuthLogin={handleOAuthLogin} />
                
                <div className="auth-alternative">
                  <ContinueSection onContinue={handleContinueWithoutLogin} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="login-footer">
        <div className="footer-content">
          <div className="footer-info">
            <p>© 2024 {APP_FULL_NAME}. Professional music production platform.</p>
          </div>
          
          <div className="footer-links">
            <a href="#" className="footer-link">Privacy Policy</a>
            <a href="#" className="footer-link">Terms of Service</a>
            <a href="#" className="footer-link">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}