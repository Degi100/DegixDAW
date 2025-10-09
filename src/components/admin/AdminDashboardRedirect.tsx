// src/components/admin/AdminDashboardRedirect.tsx
// Smart redirect for users without dashboard access

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '../../hooks/useAdmin';
import { ADMIN_ROUTES } from '../../lib/constants/adminRoutes';

export default function AdminDashboardRedirect() {
  const navigate = useNavigate();
  const { canAccessRoute } = useAdmin();

  useEffect(() => {
    // Check if user can access dashboard
    if (canAccessRoute('dashboard')) {
      return; // User has dashboard access, stay here
    }

    // Find first accessible route
    const firstAccessibleRoute = ADMIN_ROUTES.find(route =>
      route.id !== 'dashboard' && canAccessRoute(route.id)
    );

    if (firstAccessibleRoute) {
      console.log('[AdminDashboardRedirect] Redirecting to:', firstAccessibleRoute.path);
      navigate(firstAccessibleRoute.path, { replace: true });
    } else {
      // No access to any admin route
      console.log('[AdminDashboardRedirect] No accessible routes, redirecting to 404');
      navigate('/404', { replace: true });
    }
  }, [canAccessRoute, navigate]);

  return null; // This component just redirects, renders nothing
}
