// src/pages/Dashboard.corporate.tsx
// Ultimate Corporate Dashboard with Modern Professional Design

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { useWelcomeMessage } from '../hooks/useWelcomeMessage';
import { useTheme } from '../hooks/useTheme';
import { useAdmin } from '../hooks/useAdmin';
import { LoadingOverlay } from '../components/ui/Loading';
import Button from '../components/ui/Button';
import WelcomeCard from '../components/dashboard/WelcomeCard';
import FeatureGrid from '../components/dashboard/FeatureGrid';
import ProjectsSection from '../components/dashboard/ProjectsSection';
import { APP_FULL_NAME } from '../lib/constants';

export default function DashboardCorporate() {
  const navigate = useNavigate();
  const { user, loading, signOut, signInWithEmail, signInWithOAuth } = useAuth();
  const { success, error: showError } = useToast();
  const { isDark, toggleTheme } = useTheme();
  const { isAdmin } = useAdmin();
  
  // Inline login state
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginData, setLoginData] = useState<{ email: string; password: string }>({ email: '', password: '' });

  // Verwende unseren Custom Hook für Welcome-Messages
  useWelcomeMessage(user);

  const handleLogout = async () => {
    const result = await signOut();
    if (result.success) {
      success('Successfully signed out! 👋');
      navigate('/login');
    }
  };

  const handleThemeToggle = () => {
    toggleTheme();
    success(`Switched to ${isDark ? 'Light' : 'Dark'} mode! 🎨`);
  };

  const handleQuickLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const result = await signInWithEmail(loginData.email, loginData.password);
      
      if (result.success) {
        success('Successfully logged in! 🎉');
        setShowLoginForm(false);
        setLoginData({ email: '', password: '' });
      } else {
        showError(result.error?.message || 'Login failed');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      showError(`Login failed: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsSubmitting(true);
    try {
      const result = await signInWithOAuth('google');
      
      if (!result.success) {
        showError(result.error?.message || 'Google login failed');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      showError(`Google login failed: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingOverlay />;
  }

  return (
    <div className="dashboard-corporate">
      {/* Corporate Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <div className="header-main">
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
              
              {user ? (
                <>
                  <Button
                    onClick={() => navigate('/settings')}
                    variant="outline"
                    size="small"
                  >
                    ⚙️ Settings
                  </Button>
                  
                  {isAdmin && (
                    <Button
                      onClick={() => navigate('/admin')}
                      variant="success"
                      size="small"
                    >
                      🛡️ Admin
                    </Button>
                  )}
                  
                  <Button
                    onClick={handleLogout}
                    variant="outline"
                    size="small"
                  >
                    👋 Sign Out
                  </Button>
                </>
              ) : (
                <div className="inline-login">
                  {!showLoginForm ? (
                    <>
                      <Button
                        onClick={handleGoogleLogin}
                        variant="outline"
                        size="small"
                        disabled={isSubmitting}
                        className="google-login-btn"
                      >
                        🔍 Google
                      </Button>
                      
                      <Button
                        onClick={() => setShowLoginForm(true)}
                        variant="primary"
                        size="small"
                      >
                        📧 Sign In
                      </Button>
                    </>
                  ) : (
                    <div className="quick-login-form">
                      <form onSubmit={handleQuickLogin} className="login-form-inline">
                        <input
                          type="email"
                          placeholder="Email"
                          value={loginData.email}
                          onChange={(e) => setLoginData(prev => ({ ...prev, email: e.target.value }))}
                          className="login-input-inline"
                          required
                        />
                        <input
                          type="password"
                          placeholder="Password"
                          value={loginData.password}
                          onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                          className="login-input-inline"
                          required
                        />
                        <Button
                          type="submit"
                          variant="primary"
                          size="small"
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? '⏳' : '✓'}
                        </Button>
                        <Button
                          type="button"
                          onClick={() => {
                            setShowLoginForm(false);
                            setLoginData({ email: '', password: '' });
                          }}
                          variant="outline"
                          size="small"
                        >
                          ✕
                        </Button>
                      </form>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {/* Status Bar */}
          <div className="status-bar">
            <div className="status-indicators">
              <div className="status-item">
                <span className="status-icon">🟢</span>
                <span className="status-text">System Online</span>
              </div>
              <div className="status-item">
                <span className="status-icon">⚡</span>
                <span className="status-text">High Performance</span>
              </div>
              <div className="status-item">
                <span className="status-icon">🔒</span>
                <span className="status-text">Secure</span>
              </div>
            </div>
            
            {user && (
              <div className="user-status">
                <span className="user-role">
                  {user.user_metadata?.username ? `@${user.user_metadata.username}` : 'User'}
                </span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Dashboard Content */}
      <main className="dashboard-main">
        <div className="dashboard-container">
          {user ? (
            <>
              <WelcomeCard 
                user={user}
              />
              <FeatureGrid />
              <ProjectsSection />
            </>
          ) : (
            <>
              <div className="guest-hero">
                <div className="hero-content">
                  <h2 className="hero-title">Welcome to the Future of Audio Production</h2>
                  <p className="hero-description">
                    Experience professional-grade digital audio workstation tools 
                    with cloud-based collaboration and cutting-edge technology.
                  </p>
                  <div className="hero-actions">
                    <Button
                      onClick={() => navigate('/login')}
                      variant="primary"
                      size="large"
                    >
                      🚀 Start Creating
                    </Button>
                    <Button
                      onClick={() => navigate('/login')}
                      variant="outline"
                      size="large"
                    >
                      📖 Learn More
                    </Button>
                  </div>
                </div>
                
                <div className="hero-visual">
                  <div className="visual-grid">
                    <div className="visual-card">🎵</div>
                    <div className="visual-card">🎹</div>
                    <div className="visual-card">🎸</div>
                    <div className="visual-card">🥁</div>
                  </div>
                </div>
              </div>
              
              <FeatureGrid />
            </>
          )}
        </div>
      </main>
    </div>
  );
}