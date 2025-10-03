// ============================================
// AUTH HERO COMPONENT
// Hero section with title, subtitle, and features
// ============================================

import type { AuthHeroProps } from '../types/auth.types';

export default function AuthHero({ title, subtitle }: AuthHeroProps) {
  return (
    <div className="auth-hero">
      <h2 className="auth-hero-title">
        {title}
      </h2>
      <p className="auth-hero-subtitle">
        {subtitle}
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
  );
}
