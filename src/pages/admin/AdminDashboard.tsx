// src/pages/admin/AdminDashboard.tsx
// Main admin dashboard overview page

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import AdminLayout from '../../components/admin/AdminLayout';
import { useToast } from '../../hooks/useToast';
import { useAdmin } from '../../hooks/useAdmin';

interface SystemStats {
  totalUsers: number;
  todaySignups: number;
  weeklySignups: number;
  monthlySignups: number;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { error } = useToast();
  const { adminLevel } = useAdmin();

  useEffect(() => {
    loadSystemStats();
  }, []);

  const loadSystemStats = async () => {
    try {
      setLoading(true);
      
      // Get total users count
      const { count: totalUsers, error: usersError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      if (usersError) throw usersError;

      // Get today's signups (last 24 hours)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { count: todaySignups, error: todayError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString());

      if (todayError) throw todayError;

      // Get weekly signups (last 7 days)
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      const { count: weeklySignups, error: weekError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', weekAgo.toISOString());

      if (weekError) throw weekError;

      // Get monthly signups (last 30 days)
      const monthAgo = new Date();
      monthAgo.setDate(monthAgo.getDate() - 30);
      
      const { count: monthlySignups, error: monthError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', monthAgo.toISOString());

      if (monthError) throw monthError;

      setStats({
        totalUsers: totalUsers || 0,
        todaySignups: todaySignups || 0,
        weeklySignups: weeklySignups || 0,
        monthlySignups: monthlySignups || 0,
      });

    } catch (err) {
      console.error('Error loading system stats:', err);
      error('Failed to load system statistics');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="admin-dashboard">
        <header className="admin-page-header">
          <h1>Admin Dashboard</h1>
          <p>Welcome back! You have <strong>{adminLevel.replace('_', ' ')}</strong> access.</p>
        </header>

        {loading ? (
          <div className="admin-loading">
            <p>Loading system statistics...</p>
          </div>
        ) : stats ? (
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">👥</div>
              <h4 className="feature-title">Total Users</h4>
              <div className="stat-number">{stats.totalUsers}</div>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🆕</div>
              <h4 className="feature-title">Today</h4>
              <div className="stat-number">{stats.todaySignups}</div>
              <p className="feature-description">New signups</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">📅</div>
              <h4 className="feature-title">This Week</h4>
              <div className="stat-number">{stats.weeklySignups}</div>
              <p className="feature-description">New signups</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h4 className="feature-title">This Month</h4>
              <div className="stat-number">{stats.monthlySignups}</div>
              <p className="feature-description">New signups</p>
            </div>
          </div>
        ) : (
          <div className="admin-error">
            <p>Unable to load statistics. Please try again.</p>
          </div>
        )}

        <div className="admin-quick-actions">
          <h2>Quick Actions</h2>
          <div className="features-grid">
            <button className="feature-card admin-action-card" onClick={() => navigate('/admin/users')}>
              <div className="feature-icon">👥</div>
              <h4 className="feature-title">View All Users</h4>
              <p className="feature-description">Manage user accounts and permissions</p>
            </button>
            <button className="feature-card admin-action-card">
              <div className="feature-icon">🔍</div>
              <h4 className="feature-title">Search Users</h4>
              <p className="feature-description">Find specific users quickly</p>
            </button>
            <button className="feature-card admin-action-card">
              <div className="feature-icon">📊</div>
              <h4 className="feature-title">System Health</h4>
              <p className="feature-description">Monitor system performance</p>
            </button>
            <button className="feature-card admin-action-card">
              <div className="feature-icon">⚙️</div>
              <h4 className="feature-title">Settings</h4>
              <p className="feature-description">Configure system settings</p>
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}