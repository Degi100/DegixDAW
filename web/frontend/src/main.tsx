// src/main.tsx
import React, { Suspense, lazy } from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import './styles/utilities/index.css';
import ErrorBoundary from './components/ui/ErrorBoundary';
import PageLoader from './components/ui/PageLoader';
import { ToastContainer } from './components/ui/Toast';
import FeatureFlagRoute from './components/auth/FeatureFlagRoute';
import PrivateRoute from './components/auth/PrivateRoute';

// Layout Components
import AppLayout from './components/layout/AppLayout';

// Lazy load components for better code splitting
// Auth Pages
const AuthCallback = lazy(() => import('./pages/auth/AuthCallback'));
const AuthLanding = lazy(() => import('./pages/auth/AuthLanding'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));
const ResendConfirmation = lazy(() => import('./pages/auth/ResendConfirmation'));
const SetPassword = lazy(() => import('./pages/auth/SetPassword'));

// Dashboard Pages
const Dashboard = lazy(() => import('./pages/dashboard/Dashboard.corporate'));
const Social = lazy(() => import('./pages/dashboard/Social'));

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

// File Browser Pages
const FileBrowserPage = lazy(() => import('./pages/files/FileBrowserPage'));

// Project Pages
const ProjectsListPage = lazy(() => import('./pages/projects/ProjectsListPage'));
const ProjectDetailPage = lazy(() => import('./pages/projects/ProjectDetailPage'));

// Admin Components
import AdminRoute from './components/admin/AdminRoute';
import ProtectedAdminRoute from './components/admin/ProtectedAdminRoute';
import AdminLayoutCorporate from './components/admin/AdminLayoutCorporate';

const AdminDashboardCorporate = lazy(() => import('./pages/admin/AdminDashboardCorporate'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));
const AdminIssues = lazy(() => import('./pages/admin/AdminIssues'));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'));
const VersionsManagement = lazy(() => import('./pages/admin/VersionsManagement'));
const AdminFeatureFlags = lazy(() => import('./components/admin/AdminFeatureFlags'));
const AdminAnalytics = lazy(() => import('./pages/admin/AdminAnalytics'));

const router = createBrowserRouter([
  // Public welcome/login page
  {
    path: '/welcome',
    element: (
      <Suspense fallback={<PageLoader />}>
        <AuthLanding />
      </Suspense>
    ),
  },

  // All main application routes are protected and use the AppLayout.
  // The root path '/' now defaults to the dashboard.
  {
    path: '/',
    element: (
      <PrivateRoute>
        <AppLayout />
      </PrivateRoute>
    ),
    children: [
      {
        index: true, // Renders at the parent's path ('/')
        element: (
          <Suspense fallback={<PageLoader />}>
            <FeatureFlagRoute featureFlag="dashboard">
              <Dashboard />
            </FeatureFlagRoute>
          </Suspense>
        ),
      },
      {
        path: 'social',
        element: (
          <Suspense fallback={<PageLoader />}>
            <FeatureFlagRoute featureFlag="social_features">
              <Social />
            </FeatureFlagRoute>
          </Suspense>
        ),
      },
      {
        path: 'settings',
        element: (
          <Suspense fallback={<PageLoader />}>
            <UserSettings />
          </Suspense>
        ),
      },
      {
        path: 'files',
        element: (
          <Suspense fallback={<PageLoader />}>
            <FeatureFlagRoute featureFlag="file_browser">
              <FileBrowserPage />
            </FeatureFlagRoute>
          </Suspense>
        ),
      },
      {
        path: 'projects',
        element: (
          <Suspense fallback={<PageLoader />}>
            <ProjectsListPage />
          </Suspense>
        ),
      },
      {
        path: 'projects/:id',
        element: (
          <Suspense fallback={<PageLoader />}>
            <ProjectDetailPage />
          </Suspense>
        ),
      },
    ],
  },

  // Admin Routes (with own AdminLayoutCorporate - no AppLayout!)
  // These are protected by the AdminRoute component internally.
  {
    path: '/admin',
    element: (
      <Suspense fallback={<PageLoader />}>
        <AdminRoute>
          <ProtectedAdminRoute requiredRoute="dashboard">
            <AdminDashboardCorporate />
          </ProtectedAdminRoute>
        </AdminRoute>
      </Suspense>
    )
  },
  {
    path: '/admin/users',
    element: (
      <Suspense fallback={<PageLoader />}>
        <AdminRoute>
          <ProtectedAdminRoute requiredRoute="users">
            <AdminUsers />
          </ProtectedAdminRoute>
        </AdminRoute>
      </Suspense>
    )
  },
  {
    path: '/admin/issues',
    element: (
      <Suspense fallback={<PageLoader />}>
        <AdminRoute>
          <ProtectedAdminRoute requiredRoute="issues">
            <AdminIssues />
          </ProtectedAdminRoute>
        </AdminRoute>
      </Suspense>
    )
  },
  {
    path: '/admin/settings',
    element: (
      <Suspense fallback={<PageLoader />}>
        <AdminRoute>
          <ProtectedAdminRoute requiredRoute="settings">
            <AdminSettings />
          </ProtectedAdminRoute>
        </AdminRoute>
      </Suspense>
    )
  },
  {
    path: '/admin/settings/versions',
    element: (
      <Suspense fallback={<PageLoader />}>
        <AdminRoute>
          <ProtectedAdminRoute requiredRoute="versions">
            <VersionsManagement />
          </ProtectedAdminRoute>
        </AdminRoute>
      </Suspense>
    )
  },
  {
    path: '/admin/features',
    element: (
      <Suspense fallback={<PageLoader />}>
        <AdminRoute>
          <ProtectedAdminRoute requiredRoute="features">
            <AdminLayoutCorporate>
              <AdminFeatureFlags />
            </AdminLayoutCorporate>
          </ProtectedAdminRoute>
        </AdminRoute>
      </Suspense>
    )
  },
  {
    path: '/admin/analytics',
    element: (
      <Suspense fallback={<PageLoader />}>
        <AdminRoute>
          <AdminLayoutCorporate>
            <AdminAnalytics />
          </AdminLayoutCorporate>
        </AdminRoute>
      </Suspense>
    )
  },
  // Auth Routes (no header)
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
