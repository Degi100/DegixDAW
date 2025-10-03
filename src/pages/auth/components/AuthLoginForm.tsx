// ============================================
// AUTH LOGIN FORM COMPONENT
// Login form with OAuth options
// ============================================

import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import type { AuthLoginFormProps } from '../types/auth.types';

export default function AuthLoginForm({
  loginData,
  isSubmitting,
  onSubmit,
  onInputChange,
  onOAuthLogin,
  onSwitchToRegister,
  onForgotPassword
}: AuthLoginFormProps) {
  return (
    <div className="auth-form-container">
      <h3 className="auth-form-title">Sign In</h3>
      <p className="auth-form-subtitle">Welcome back! Please sign in to your account.</p>

      <form onSubmit={onSubmit} className="auth-form">
        <div className="form-group">
          <Input
            type="email"
            label="Email"
            value={loginData.email}
            onChange={(e) => onInputChange('email', e.target.value)}
            required
            placeholder="your@email.com"
          />
        </div>

        <div className="form-group">
          <Input
            type="password"
            label="Password"
            value={loginData.password}
            onChange={(e) => onInputChange('password', e.target.value)}
            required
            placeholder="Your password"
            showPasswordToggle={true}
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
          onClick={onForgotPassword}
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
          onClick={() => onOAuthLogin('google')}
          variant="outline"
          fullWidth
          className="oauth-btn google-btn"
        >
          <span className="oauth-icon">🌐</span>
          Continue with Google
        </Button>

        <Button
          onClick={() => onOAuthLogin('discord')}
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
            onClick={onSwitchToRegister}
            className="auth-switch-link"
          >
            Sign up
          </button>
        </p>
      </div>
    </div>
  );
}
