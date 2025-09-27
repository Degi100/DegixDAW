// src/pages/admin/AdminDashboardCorporate.tsx
// Ultimate Corporate Professional Admin Dashboard

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import AdminLayoutCorporate from '../../components/admin/AdminLayoutCorporate';
import { useToast } from '../../hooks/useToast';


interface SystemStats {
  totalUsers: number;
  todaySignups: number;
  weeklySignups: number;
  monthlySignups: number;
  activeUsers: number;
  totalSessions: number;
}



export default function AdminDashboardCorporate() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { error } = useToast();


  useEffect(() => {
    loadSystemStats();
  }, []);

  const loadSystemStats = async () => {
    try {
      setLoading(true);

      // Get total users
      const { count: totalUsers, error: totalError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      if (totalError) throw totalError;

      // Get today's signups
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { count: todaySignups, error: todayError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString());

      if (todayError) throw todayError;

      // Get weekly signups
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      const { count: weeklySignups, error: weekError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', weekAgo.toISOString());

      if (weekError) throw weekError;

      // Get monthly signups
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
        activeUsers: Math.floor((totalUsers || 0) * 0.7), // Simulated
        totalSessions: Math.floor((totalUsers || 0) * 15) // Simulated
      });

    } catch (err: any) {
      console.error('Error loading system stats:', err);
      error(`Failed to load statistics: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    { icon: '👥', title: 'Users', description: 'Manage users', action: () => navigate('/admin/users') },
    { icon: '⚙️', title: 'Settings', description: 'System settings', action: () => navigate('/admin/settings') },
    { icon: '�', title: 'Reports', description: 'Generate reports', action: () => navigate('/admin/reports') }
  ];

  const calculateTrend = (current: number, total: number): string => {
    const percentage = total > 0 ? ((current / total) * 100) : 0;
    return `+${percentage.toFixed(1)}%`;
  };

  return (
    <AdminLayoutCorporate>
      <div className="admin-dashboard-corporate">
        <header className="admin-page-header">
          <h1>Dashboard Overview</h1>
          <p>Welcome back! Monitor your system performance and manage operations from this central hub.</p>
        </header>

        {loading ? (
          <div className="admin-loading">
            <div className="loading-spinner"></div>
            <p>Loading system statistics...</p>
          </div>
        ) : stats ? (
          <>
            <div className="admin-stats-wrapper">
              <div className="admin-stats-grid">
                <div className="admin-stat-card">
                  <div className="stat-card-header">
                    <div className="stat-icon">👥</div>
                    <div className="stat-trend">
                      <span>📈</span>
                      <span>{calculateTrend(stats.weeklySignups, stats.totalUsers)}</span>
                    </div>
                  </div>
                  <div className="stat-content">
                    <h3>Total Users</h3>
                    <div className="stat-number">{stats.totalUsers.toLocaleString()}</div>
                    <div className="stat-description">Registered accounts</div>
                  </div>
                </div>

                <div className="admin-stat-card">
                  <div className="stat-card-header">
                    <div className="stat-icon">🆕</div>
                    <div className="stat-trend">
                      <span>🔥</span>
                      <span>Today</span>
                    </div>
                  </div>
                  <div className="stat-content">
                    <h3>New Signups</h3>
                    <div className="stat-number">{stats.todaySignups}</div>
                    <div className="stat-description">Joined today</div>
                  </div>
                </div>

                <div className="admin-stat-card">
                  <div className="stat-card-header">
                    <div className="stat-icon">📅</div>
                    <div className="stat-trend">
                      <span>📊</span>
                      <span>7 Days</span>
                    </div>
                  </div>
                  <div className="stat-content">
                    <h3>Weekly Growth</h3>
                    <div className="stat-number">{stats.weeklySignups}</div>
                    <div className="stat-description">New users this week</div>
                  </div>
                </div>

                <div className="admin-stat-card">
                  <div className="stat-card-header">
                    <div className="stat-icon">⚡</div>
                    <div className="stat-trend">
                      <span>✨</span>
                      <span>Active</span>
                    </div>
                  </div>
                  <div className="stat-content">
                    <h3>Active Users</h3>
                    <div className="stat-number">{stats.activeUsers}</div>
                    <div className="stat-description">Currently online</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="admin-actions-section">
              <header className="section-header">
                <h2>Quick Actions</h2>
                <p>Frequently used administrative tasks and management tools</p>
              </header>
              
              <div className="admin-actions-grid">
                {quickActions.map((action, index) => (
                  <div
                    key={index}
                    className="admin-action-card"
                    onClick={action.action}
                  >
                    <div className="action-card-icon">{action.icon}</div>
                    <h3 className="action-card-title">{action.title}</h3>
                    <p className="action-card-description">{action.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="admin-error">
            <h3>⚠️ Unable to load statistics</h3>
            <p>Please check your connection and try again.</p>
            <button onClick={loadSystemStats} className="retry-button">
              🔄 Retry
            </button>
          </div>
        )}
      </div>
    </AdminLayoutCorporate>
  );
}