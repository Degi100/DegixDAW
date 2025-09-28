// src/pages/Dashboard.corporate.tsx
// Ultimate Corporate Dashrn Professional Design

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { useWelcomeMessage } from '../hooks/useWelcomeMessage';
import { useTheme } from '../hooks/useTheme';
import { useAdmin } from '../hooks/useAdmin';
import { LoadingOverlay } from '../components/ui/Loading';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input'; // Import der Input-Komponente
import WelcomeCard from '../components/dashboard/WelcomeCard';
import FeatureGrid from '../components/dashboard/FeatureGrid';
import ProjectsSection from '../components/dashboard/ProjectsSection';
import { APP_FULL_NAME } from '../lib/constants';

export default function DashboardCorporate() {
  const navigate = useNavigate();
  const { user, loading, signOut, signInWithEmail, signUpWithEmail, signInWithOAuth } = useAuth();
  const { success, error: showError } = useToast();
  const { isDark, toggleTheme } = useTheme();
  const { isAdmin } = useAdmin();
  
  // Multi-step login state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [signOutLoading, setSignOutLoading] = useState(false);
  const [loginData, setLoginData] = useState<{ email: string; password: string }>({ email: '', password: '' });
  const [registerData, setRegisterData] = useState<{ fullName: string; email: string; password: string; confirmPassword: string }>({ fullName: '', email: '', password: '', confirmPassword: '' });
  const [loginStep, setLoginStep] = useState<'initial' | 'email' | 'fullForm'>('initial');
  const [showRegisterForm, setShowRegisterForm] = useState(false);


  // Verwende unseren Custom Hook für Welcome-Messages
  useWelcomeMessage(user);

  const handleLogout = async () => {
    if (signOutLoading) return; // Prevent double-clicks
    
    try {
      setSignOutLoading(true);
      console.log('Starting sign out process...');
      
      const result = await signOut();
      
      if (result.success) {
        success('Erfolgreich abgemeldet! 👋');
        console.log('Sign out successful');
        // Navigation is handled by the signOut function itself
      } else {
        console.error('Sign out failed:', result.error);
        showError(result.error?.message || 'Abmeldung fehlgeschlagen');
        setSignOutLoading(false);
      }
    } catch (error) {
      console.error('Sign out error:', error);
      showError('Abmeldung fehlgeschlagen. Bitte versuchen Sie es erneut.');
      setSignOutLoading(false);
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
        success('Erfolgreich angemeldet! 🎉');
        setLoginData({ email: '', password: '' });
        setRegisterData({ fullName: '', email: '', password: '', confirmPassword: '' });
        setLoginStep('initial');
      } else {
        showError(result.error?.message || 'Anmeldung fehlgeschlagen');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unbekannter Fehler';
      showError(`Anmeldung fehlgeschlagen: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if full name is provided
    if (!registerData.fullName.trim()) {
      showError('Vollständiger Name ist erforderlich');
      return;
    }
    
    // Basic password confirmation check
    if (registerData.password !== registerData.confirmPassword) {
      showError('Passwörter stimmen nicht überein');
      return;
    }
    
    if (registerData.password.length < 6) {
      showError('Passwort muss mindestens 6 Zeichen haben');
      return;
    }
    
    // Check for uppercase, lowercase, and number
    const hasUppercase = /[A-Z]/.test(registerData.password);
    const hasLowercase = /[a-z]/.test(registerData.password);
    const hasNumber = /\d/.test(registerData.password);
    
    if (!hasUppercase || !hasLowercase || !hasNumber) {
      showError('Passwort muss Groß-/Kleinbuchstaben und eine Zahl enthalten');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Rufen Sie die Registrierungsfunktion auf
      const result = await signUpWithEmail({
        email: registerData.email,
        password: registerData.password,
        fullName: registerData.fullName,
        // Ein Standard-Username kann hier generiert oder im Onboarding festgelegt werden
        username: registerData.email.split('@')[0], 
      });
      
      if (result.success) {
        success('Konto erfolgreich erstellt! Bitte bestätigen Sie Ihre E-Mail. 🎉');
        setRegisterData({ fullName: '', email: '', password: '', confirmPassword: '' });
        setShowRegisterForm(false);
      } else {
        showError(result.error?.message || 'Registrierung fehlgeschlagen');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unbekannter Fehler';
      showError(`Registrierung fehlgeschlagen: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // resetLoginFlow function removed as it was unused

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
                    ⚙️ Einstellungen
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
                    disabled={signOutLoading || loading}
                  >
                    {signOutLoading ? '⏳ Abmelden...' : '👋 Abmelden'}
                  </Button>
                </>
              ) : (
                <div className="multi-step-login">
                  {/* Google Login Button - Always visible */}
                  <Button
                    onClick={handleGoogleLogin}
                    variant="outline"
                    size="small"
                    disabled={isSubmitting}
                    className="google-login-btn"
                    title="Mit Google anmelden"
                  >
                    G
                  </Button>
                  
                  {loginStep === 'initial' && (
                    /* Login Button with Hover Forms */
                    <div className="simple-login-container">
                      <div className="expandable-login-container">
                        <div className="login-trigger">
                          <Button
                            variant="primary"
                            size="small"
                            className="expandable-login-btn"
                          >
                            🔑 Anmelden
                          </Button>
                        </div>
                        
                        {/* Expandable Login Form - Shows on Hover */}
                        <div className="expandable-form">
                          <form onSubmit={handleQuickLogin} className="hover-login-form">
                            <div className="form-inputs">
                              <Input
                                type="email"
                                placeholder="E-Mail"
                                value={loginData.email}
                                onChange={(e) => setLoginData(prev => ({ ...prev, email: e.target.value }))}
                                required
                              />
                              <Input
                                type="password"
                                placeholder="Passwort"
                                value={loginData.password}
                                onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                                required
                                showPasswordToggle
                              />
                            </div>
                            
                            <div className="form-actions">
                              <Button
                                type="submit"
                                variant="primary"
                                size="small"
                                disabled={isSubmitting}
                                className="submit-btn"
                              >
                                {isSubmitting ? '⏳' : '✓'}
                              </Button>
                            </div>
                            
                            {/* Register Button - Shows on Login Hover */}
                            <div className="register-link">
                              <button
                                type="button"
                                onClick={() => setShowRegisterForm(true)}
                                className="register-hyperlink"
                                title="Neues Konto erstellen"
                              >
                                ✨ Registrieren
                              </button>
                            </div>
                          </form>
                        </div>
                      </div>
                    </div>
                  )}
                  

                  
                  {loginStep === 'fullForm' && (
                    /* Step 3: Login Form with Pre-filled Email */
                    <div className="full-login-form">
                      <form onSubmit={handleQuickLogin} className="complete-login-form">
                        <div className="form-header">
                          <span className="form-title">🔑 Anmeldung abschließen</span>
                        </div>
                        
                        <div className="form-inputs">
                          <input
                            type="email"
                            placeholder="E-Mail"
                            value={loginData.email}
                            onChange={(e) => setLoginData(prev => ({ ...prev, email: e.target.value }))}
                            className="full-form-input"
                            required
                            readOnly
                          />
                          <input
                            type="password"
                            placeholder="Passwort eingeben"
                            value={loginData.password}
                            onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                            className="full-form-input"
                            required
                            autoFocus
                          />
                        </div>
                        
                        <div className="form-actions">
                          <Button
                            type="submit"
                            variant="primary"
                            size="small"
                            disabled={isSubmitting}
                            className="final-submit-btn"
                          >
                            {isSubmitting ? '⏳ Anmelden...' : '✓ Anmelden'}
                          </Button>
                        </div>
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
                <span className="status-text">Hohe Leistung</span>
              </div>
              <div className="status-item">
                <span className="status-icon">🔒</span>
                <span className="status-text">Sicher</span>
              </div>
            </div>
            
            {user && (
              <div className="user-status">
                <span className="user-role">
                  {user.user_metadata?.username ? `@${user.user_metadata.username}` : 'Benutzer'}
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
          ) : showRegisterForm ? (
            /* Register Form - Shows in Main Area */
            <div className="register-main-content">
              <div className="form-navigation">
                <button
                  type="button"
                  onClick={() => setShowRegisterForm(false)}
                  className="nav-back-btn"
                  title="Zurück zur Startseite"
                >
                  ← Zurück
                </button>
                <div className="breadcrumb">
                  <button
                    type="button"
                    onClick={() => setShowRegisterForm(false)}
                    className="breadcrumb-link"
                    title="Zurück zur Startseite"
                  >
                    Startseite
                  </button>
                  <span className="breadcrumb-separator">/</span>
                  <span className="breadcrumb-item active">Registrieren</span>
                </div>
              </div>
              
              <div className="register-form-container">
                <div className="register-form-card">
                  <div className="form-header">
                    <h2 className="form-title">Registrierung</h2>
                    <p className="form-subtitle">Erstellen Sie Ihr Konto für den Zugang zur Plattform</p>
                  </div>
                  
                  <form onSubmit={handleRegistration} className="complete-register-form">
                    <div className="form-section">
                      <h3 className="section-title">Registrieren mit Email</h3>
                      
                      <div className="form-inputs">
                        <Input
                          label="Vollständiger Name"
                          type="text"
                          placeholder="Vor- und Nachname"
                          value={registerData.fullName}
                          onChange={(e) => setRegisterData(prev => ({ ...prev, fullName: e.target.value }))}
                        />
                        
                        <Input
                          label="Email-Adresse"
                          type="email"
                          placeholder="ihre@email.de"
                          value={registerData.email}
                          onChange={(e) => setRegisterData(prev => ({ ...prev, email: e.target.value }))}
                        />
                        
                        <Input
                          label="Passwort"
                          type="password"
                          placeholder="Mindestens 6 Zeichen"
                          value={registerData.password}
                          onChange={(e) => setRegisterData(prev => ({ ...prev, password: e.target.value }))}
                          showPasswordToggle
                        />
                        
                        <Input
                          label="Passwort bestätigen"
                          type="password"
                          placeholder="Passwort erneut eingeben"
                          value={registerData.confirmPassword}
                          onChange={(e) => setRegisterData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                          showPasswordToggle
                        />
                      </div>
                      
                      <div className="form-actions">
                        <Button
                          type="submit"
                          variant="success"
                          size="large"
                          disabled={isSubmitting}
                          className="register-submit-btn"
                        >
                          {isSubmitting ? '⏳ Erstellen...' : 'Registrieren'}
                        </Button>
                      </div>
                      
                      <div className="form-footer">
                        <p className="login-prompt">
                          Bereits ein Account? 
                          <button
                            type="button"
                            onClick={() => setShowRegisterForm(false)}
                            className="login-link-btn"
                          >
                            Hier anmelden
                          </button>
                        </p>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
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