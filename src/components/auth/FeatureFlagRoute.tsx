// src/components/auth/FeatureFlagRoute.tsx
import { type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useAdmin } from '../../hooks/useAdmin';
import { useFeatureFlags } from '../../hooks/useFeatureFlags';
import { canAccessFeature, getUserRole } from '../../lib/services/featureFlags';
import PageLoader from '../ui/PageLoader';

interface FeatureFlagRouteProps {
  children: ReactNode;
  featureFlag: string;
}

export default function FeatureFlagRoute({ children, featureFlag }: FeatureFlagRouteProps) {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, isModerator, loading: adminLoading } = useAdmin();
  const { features, loading: featuresLoading } = useFeatureFlags();

  const isLoading = authLoading || adminLoading || featuresLoading;

  console.log(`%c[FeatureFlagRoute] Rendering for feature "${featureFlag}"`, 'color: #06b6d4', {
    featureFlag,
    user: user?.email,
    isAdmin,
    isModerator,
    authLoading,
    adminLoading,
    featuresLoading,
    isLoading
  });

  if (isLoading) {
    return <PageLoader />;
  }

  // Find the feature object by ID
  const feature = features.find(f => f.id === featureFlag);

  // Determine role only if user is logged in
  const userRole = user ? getUserRole(!!user, isAdmin, isModerator) : 'public';
  const hasAccess = canAccessFeature(feature, userRole, isAdmin);

  console.log(`%c[FeatureFlagRoute] Access decision for "${featureFlag}"`, hasAccess ? 'color: #22c55e' : 'color: #ef4444', {
    featureFlag,
    userRole,
    hasAccess
  });

  if (!hasAccess) {
    // Special handling for dashboard route (homepage)
    if (featureFlag === 'dashboard') {
      // If dashboard is disabled, redirect to social if available, otherwise settings
      const socialFeature = features.find(f => f.id === 'social_features');
      const hasSocialAccess = canAccessFeature(socialFeature, userRole, isAdmin);
      const redirectTo = hasSocialAccess ? '/social' : '/settings';
      console.log(`%c[FeatureFlagRoute] Dashboard not accessible. Redirecting to ${redirectTo}`, 'color: #f97316');
      return <Navigate to={redirectTo} replace />;
    }

    // For other features, redirect to 404 to not reveal the route exists
    console.log(`%c[FeatureFlagRoute] Feature "${featureFlag}" not accessible. Redirecting to /404`, 'color: #ef4444');
    return <Navigate to="/404" replace />;
  }

  return <>{children}</>;
}
