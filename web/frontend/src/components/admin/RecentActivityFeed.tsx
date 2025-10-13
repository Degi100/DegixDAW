// src/components/admin/RecentActivityFeed.tsx
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

interface ActivityItem {
  id: string;
  type: 'user_registered' | 'user_deleted' | 'settings_changed' | 'system_event';
  message: string;
  timestamp: string;
  icon: string;
}

export default function RecentActivityFeed() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentActivity();
  }, []);

  const fetchRecentActivity = async () => {
    try {
      setLoading(true);

      // Get recent user registrations
      const { data: recentUsers, error } = await supabase
        .from('profiles')
        .select('id, username, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;

      // Convert to activity items
      const activities: ActivityItem[] = (recentUsers || []).map(user => ({
        id: user.id,
        type: 'user_registered' as const,
        message: `New user registered: ${user.username || 'Unknown'}`,
        timestamp: user.created_at,
        icon: '✨'
      }));

      // Add some mock system events
      // In production, these would come from an activity log table
      const mockEvents: ActivityItem[] = [
        {
          id: 'evt-1',
          type: 'system_event',
          message: 'System backup completed successfully',
          timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
          icon: '💾'
        },
        {
          id: 'evt-2',
          type: 'settings_changed',
          message: 'Security settings updated',
          timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
          icon: '⚙️'
        }
      ];

      const allActivities = [...activities, ...mockEvents]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 8);

      setActivities(allActivities);
    } catch (err) {
      console.error('Failed to fetch recent activity:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="recent-activity-feed">
        <div className="activity-header">
          <h3>📋 Recent Activity</h3>
        </div>
        <div className="activity-list">
          {[1, 2, 3].map(i => (
            <div key={i} className="activity-item loading">
              <div className="loading-spinner" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="recent-activity-feed">
      <div className="activity-header">
        <h3>📋 Recent Activity</h3>
        <button 
          className="refresh-button"
          onClick={fetchRecentActivity}
          title="Refresh activity"
        >
          🔄
        </button>
      </div>
      
      <div className="activity-list">
        {activities.length === 0 ? (
          <div className="activity-empty">
            <p>No recent activity</p>
          </div>
        ) : (
          activities.map(activity => (
            <div key={activity.id} className="activity-item">
              <div className="activity-icon">{activity.icon}</div>
              <div className="activity-content">
                <div className="activity-message">{activity.message}</div>
                <div className="activity-timestamp">
                  {formatTimestamp(activity.timestamp)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
