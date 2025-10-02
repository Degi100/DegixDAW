// src/main.tsx
import React, { Suspense, lazy } from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import './styles/utilities/index.css';
import ErrorBoundary from './components/ui/ErrorBoundary';
import PageLoader from './components/ui/PageLoader';
import { ToastContainer } from './components/ui/Toast';

// Lazy load components for better code splitting
// Auth Pages
const AuthCallback = lazy(() => import('./pages/auth/AuthCallback'));
const AuthLanding = lazy(() => import('./pages/auth/AuthLanding'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));
const ResendConfirmation = lazy(() => import('./pages/auth/ResendConfirmation'));
const SetPassword = lazy(() => import('./pages/auth/SetPassword'));

// Dashboard Pages
const Dashboard = lazy(() => import('./pages/dashboard/Dashboard.corporate'));

// Settings Pages
const UserSettings = lazy(() => import('./pages/settings/UserSettings.corporate'));

// Account Management Pages
const AccountRecovery = lazy(() => import('./pages/account/AccountRecovery'));
const RecoverAccount = lazy(() => import('./pages/account/RecoverAccount'));
const EmailConfirmed = lazy(() => import('./pages/account/EmailConfirmed'));
const EmailChangeConfirmation = lazy(() => import('./pages/account/EmailChangeConfirmation'));

// Onboarding Pages
const UsernameOnboarding = lazy(() => import('./pages/onboarding/UsernameOnboarding'));

// Other Pages
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
        <AuthLanding />
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
    path: '/auth/set-password', 
    element: (
      <Suspense fallback={<PageLoader />}>
        <SetPassword />
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