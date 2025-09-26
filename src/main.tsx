// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import './styles/utilities/index.css';
import Login from './pages/Login.advanced';
import AuthCallback from './pages/AuthCallback';
import Dashboard from './pages/Dashboard.advanced';
import UserSettings from './pages/UserSettings.advanced';
import UsernameOnboarding from './pages/UsernameOnboarding';
import ResendConfirmation from './pages/ResendConfirmation';
import NotFound from './pages/NotFound';
import ErrorBoundary from './components/ui/ErrorBoundary';

const router = createBrowserRouter([
  { path: '/', element: <Dashboard /> },
  { path: '/dashboard', element: <Dashboard /> },
  { path: '/login', element: <Login /> },
  { path: '/auth/callback', element: <AuthCallback /> },
  { path: '/auth/resend-confirmation', element: <ResendConfirmation /> },
  { path: '/onboarding/username', element: <UsernameOnboarding /> },
  { path: '/settings', element: <UserSettings /> },
  { path: '*', element: <NotFound /> },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <RouterProvider router={router} />
    </ErrorBoundary>
  </React.StrictMode>,
);