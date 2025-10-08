// src/components/admin/AdminRoute.tsx
// Protected route component for admin-only areas

import { type ReactNode, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAdmin } from '../../hooks/useAdmin';
import { useAuth } from '../../hooks/useAuth';
import { LoadingOverlay } from '../ui/Loading';

interface AdminRouteProps {
  children: ReactNode;
  requireSuperAdmin?: boolean;
}

export default function AdminRoute({ children, requireSuperAdmin = false }: AdminRouteProps) {
  const { user, loading } = useAuth();
  const { isAdmin, isSuperAdmin } = useAdmin();
  const [adminCheckComplete, setAdminCheckComplete] = useState(false);
  

  
  // Warte bis Admin-Check abgeschlossen ist
  useEffect(() => {
    if (!loading && user) {
      // Kurze Verzögerung um sicherzustellen, dass useAdmin fertig ist
      const timer = setTimeout(() => {
        setAdminCheckComplete(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [loading, user, isAdmin, isSuperAdmin]);



  // Show loading while auth state is being determined
  if (loading || !adminCheckComplete) {
    return <LoadingOverlay />;
  }

  // Redirect to login if not authenticated
  if (!user) {
  return <Navigate to="/welcome" replace />;
  }

  // Check admin permissions
  const hasRequiredPermission = requireSuperAdmin ? isSuperAdmin : isAdmin;
  
  if (!hasRequiredPermission) {
    // Redirect to 404 to not reveal admin routes exist
    return <Navigate to="/404" replace />;
  }

  return <>{children}</>;
}