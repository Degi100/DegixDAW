// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import './styles/utilities/index.css';
import Login from './pages/Login.advanced';
import AuthCallback from './pages/AuthCallback';
import Dashboard from './pages/Dashboard.advanced';
import UserSettings from './pages/UserSettings.advanced';

const router = createBrowserRouter([
  { path: '/login', element: <Login /> },
  { path: '/auth/callback', element: <AuthCallback /> },
  { path: '/settings', element: <UserSettings /> },
  { path: '/', element: <Dashboard /> },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);