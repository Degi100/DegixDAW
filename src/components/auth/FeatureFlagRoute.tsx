// src/components/auth/FeatureFlagRoute.tsx
import { type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useAdmin } from '../../hooks/useAdmin';
import { canAccessFeature, getUserRole } from '../../lib/constants/featureFlags';
import PageLoader from '../ui/PageLoader';

interface FeatureFlagRouteProps {
  children: ReactNode;
  featureFlag: string;
}

export default function FeatureFlagRoute({ children, featureFlag }: FeatureFlagRouteProps) {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, isModerator, loading: adminLoading } = useAdmin();

  const isLoading = authLoading || adminLoading;

  console.log(`%c[FeatureFlagRoute] Rendering for feature "${featureFlag}"`, 'color: #06b6d4', {
    featureFlag,
    user: user?.email,
    isAdmin,
    isModerator,
    authLoading,
    adminLoading,
    isLoading
  });

  if (isLoading) {
    return <PageLoader />;
  }

  // Determine role only if user is logged in
  const userRole = user ? getUserRole(isAdmin, isModerator) : 'public';
  const hasAccess = canAccessFeature(featureFlag, userRole, isAdmin);

  console.log(`%c[FeatureFlagRoute] Access decision for "${featureFlag}"`, hasAccess ? 'color: #22c55e' : 'color: #ef4444', {
    featureFlag,
    userRole,
    hasAccess
  });

  if (!hasAccess) {
    // For critical app features (dashboard, social), redirect to settings as fallback
    // For optional features (file browser, etc.), show 404
    const criticalFeatures = ['dashboard', 'social_features'];
    
    if (criticalFeatures.includes(featureFlag)) {
      console.log(`%c[FeatureFlagRoute] Critical feature "${featureFlag}" not accessible. Redirecting to /settings`, 'color: #f97316');
      return <Navigate to="/settings" replace />;
    }
    
    // For optional features, redirect to 404 to not reveal the route exists
    return <Navigate to="/404" replace />;
  }

  return <>{children}</>;
}
