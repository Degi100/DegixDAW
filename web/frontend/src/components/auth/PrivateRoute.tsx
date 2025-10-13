// src/components/auth/PrivateRoute.tsx
import { type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import PageLoader from '../ui/PageLoader';

interface PrivateRouteProps {
  children: ReactNode;
}

/**
 * A route guard that checks for an authenticated user.
 * If the user is not authenticated, it redirects to the /welcome page.
 * It shows a loader while the authentication status is being determined.
 */
export default function PrivateRoute({ children }: PrivateRouteProps) {
  const { user, initialized } = useAuth();

  // Show a loader while the auth state is being initialized.
  // 'initialized' is more reliable than 'loading' for the initial check.
  if (!initialized) {
    return <PageLoader />;
  }

  // If initialization is complete and there is no user, redirect to the landing page.
  if (!user) {
    return <Navigate to="/welcome" replace />;
  }

  // If the user is authenticated, render the requested component.
  return <>{children}</>;
}
