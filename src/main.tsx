// src/main.tsx
import React, { Suspense, lazy } from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import './styles/utilities/index.css';
import ErrorBoundary from './components/ui/ErrorBoundary';
import PageLoader from './components/ui/PageLoader';
import { ToastContainer } from './components/ui/Toast';

// Lazy load components for better code splitting
// Login-Komponente entfernt, da Route gelöscht
const AuthCallback = lazy(() => import('./pages/AuthCallback'));
const Dashboard = lazy(() => import('./pages/Dashboard.corporate'));
const UserSettings = lazy(() => import('./pages/UserSettings.corporate'));
const UsernameOnboarding = lazy(() => import('./pages/UsernameOnboarding'));
const ResendConfirmation = lazy(() => import('./pages/ResendConfirmation'));
const EmailConfirmed = lazy(() => import('./pages/EmailConfirmed'));
const EmailChangeConfirmation = lazy(() => import('./pages/EmailChangeConfirmation'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const AccountRecovery = lazy(() => import('./pages/AccountRecovery'));
const RecoverAccount = lazy(() => import('./pages/RecoverAccount'));
const NotFound = lazy(() => import('./pages/NotFound'));

// Admin Components
import AdminRoute from './components/admin/AdminRoute';

const AdminDashboardCorporate = lazy(() => import('./pages/admin/AdminDashboardCorporate'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));



const router = createBrowserRouter([
  { 
    path: '/', 
    element: (
      <Suspense fallback={<PageLoader />}>
        <Dashboard />
      </Suspense>
    ) 
  },
  { 
    path: '/dashboard', 
    element: (
      <Suspense fallback={<PageLoader />}>
        <Dashboard />
      </Suspense>
    ) 
  },
  // /login Route entfernt
  { 
    path: '/auth/callback', 
    element: (
      <Suspense fallback={<PageLoader />}>
        <AuthCallback />
      </Suspense>
    ) 
  },
  { 
    path: '/auth/resend-confirmation', 
    element: (
      <Suspense fallback={<PageLoader />}>
        <ResendConfirmation />
      </Suspense>
    ) 
  },
  { 
    path: '/auth/email-confirmed', 
    element: (
      <Suspense fallback={<PageLoader />}>
        <EmailConfirmed />
      </Suspense>
    ) 
  },
  { 
    path: '/auth/email-change-confirmed', 
    element: (
      <Suspense fallback={<PageLoader />}>
        <EmailChangeConfirmation />
      </Suspense>
    ) 
  },
  { 
    path: '/auth/forgot-password', 
    element: (
      <Suspense fallback={<PageLoader />}>
        <ForgotPassword />
      </Suspense>
    ) 
  },
  { 
    path: '/auth/recovery', 
    element: (
      <Suspense fallback={<PageLoader />}>
        <AccountRecovery />
      </Suspense>
    ) 
  },
  { 
    path: '/auth/recover', 
    element: (
      <Suspense fallback={<PageLoader />}>
        <RecoverAccount />
      </Suspense>
    ) 
  },
  { 
    path: '/onboarding/username', 
    element: (
      <Suspense fallback={<PageLoader />}>
        <UsernameOnboarding />
      </Suspense>
    ) 
  },
  { 
    path: '/settings', 
    element: (
      <Suspense fallback={<PageLoader />}>
        <UserSettings />
      </Suspense>
    ) 
  },
  // Admin Routes (Protected)
  { 
    path: '/admin', 
    element: (
      <Suspense fallback={<PageLoader />}>
        <AdminRoute>
          <AdminDashboardCorporate />
        </AdminRoute>
      </Suspense>
    ) 
  },
  { 
    path: '/admin/users', 
    element: (
      <Suspense fallback={<PageLoader />}>
        <AdminRoute>
          <AdminUsers />
        </AdminRoute>
      </Suspense>
    ) 
  },
  { 
    path: '/404', 
    element: (
      <Suspense fallback={<PageLoader />}>
        <NotFound />
      </Suspense>
    ) 
  },
  { 
    path: '*', 
    element: (
      <Suspense fallback={<PageLoader />}>
        <NotFound />
      </Suspense>
    ) 
  },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <RouterProvider router={router} />
      <ToastContainer />
    </ErrorBoundary>
  </React.StrictMode>,
);