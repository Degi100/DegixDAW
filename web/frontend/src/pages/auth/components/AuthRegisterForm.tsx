// ============================================
// AUTH REGISTER FORM COMPONENT
// Registration form with name fields
// ============================================

import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import type { AuthRegisterFormProps } from '../types/auth.types';

export default function AuthRegisterForm({
  registerData,
  isSubmitting,
  onSubmit,
  onInputChange,
  onSwitchToLogin
}: AuthRegisterFormProps) {
  return (
    <div className="auth-form-container">
      <h3 className="auth-form-title">Create Account</h3>
      <p className="auth-form-subtitle">Join our community of music producers.</p>

      <form onSubmit={onSubmit} className="auth-form">
        <div className="form-row">
          <div className="form-group">
            <Input
              label="First Name"
              value={registerData.firstName}
              onChange={(e) => onInputChange('firstName', e.target.value)}
              required
              placeholder="John"
            />
          </div>
          <div className="form-group">
            <Input
              label="Last Name"
              value={registerData.lastName}
              onChange={(e) => onInputChange('lastName', e.target.value)}
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
            onChange={(e) => onInputChange('email', e.target.value)}
            required
            placeholder="your@email.com"
          />
        </div>

        <div className="form-group">
          <Input
            type="password"
            label="Password"
            value={registerData.password}
            onChange={(e) => onInputChange('password', e.target.value)}
            required
            placeholder="Create a strong password"
            showPasswordToggle={true}
          />
        </div>

        <div className="form-group">
          <Input
            type="password"
            label="Confirm Password"
            value={registerData.confirmPassword}
            onChange={(e) => onInputChange('confirmPassword', e.target.value)}
            required
            placeholder="Confirm your password"
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
          {isSubmitting ? 'Creating Account...' : 'Create Account'}
        </Button>
      </form>

      <div className="auth-switch">
        <p>
          Already have an account?{' '}
          <button
            onClick={onSwitchToLogin}
            className="auth-switch-link"
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}
