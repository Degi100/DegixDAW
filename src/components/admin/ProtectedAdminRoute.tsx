// src/components/admin/ProtectedAdminRoute.tsx
// Protects admin routes with granular permission check

import { type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAdmin } from '../../hooks/useAdmin';
import { useAuth } from '../../hooks/useAuth';

interface ProtectedAdminRouteProps {
  children: ReactNode;
  requiredRoute: string; // Route-ID die für Zugriff benötigt wird (z.B. "issues")
}

export default function ProtectedAdminRoute({ children, requiredRoute }: ProtectedAdminRouteProps) {
  const { loading: authLoading } = useAuth();
  const { canAccessRoute, isModerator, loading: adminLoading } = useAdmin();

  // Wait for auth and admin checks to complete
  if (authLoading || adminLoading) {
    return null; // Don't show anything while loading (AdminRoute already shows LoadingOverlay)
  }

  const hasAccess = canAccessRoute(requiredRoute);

  // Check if user can access this specific route
  if (!hasAccess) {
    // Special case: Moderator tries to access dashboard → redirect to issues
    if (isModerator && requiredRoute === 'dashboard') {
      return <Navigate to="/admin/issues" replace />;
    }

    // Redirect to 404 (user has no permission for this route)
    return <Navigate to="/404" replace />;
  }

  return <>{children}</>;
}
