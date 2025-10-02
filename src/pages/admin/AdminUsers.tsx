// src/pages/admin/AdminUsers.tsx
// User management page for admins

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import AdminLayoutCorporate from '../../components/admin/AdminLayoutCorporate';
import { useToast } from '../../hooks/useToast';
import Button from '../../components/ui/Button';

interface UserProfile {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  username: string | null;
  full_name: string | null;
  profile_created_at: string | null;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { success, error } = useToast();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);

      // Try to use RPC function first (shows all users)
      const { data: rpcData, error: rpcError } = await supabase
        .rpc('get_all_users');

      if (!rpcError && rpcData) {
        // RPC function worked - we have all users
        setUsers(rpcData);
        return;
      }

      // Fallback: load from profiles table only (limited view)
      console.warn('RPC function not available, falling back to profiles only:', rpcError);

      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: false })
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      if (!data) {
        error('Keine User-Daten gefunden!');
        setUsers([]);
        return;
      }

      setUsers(data);
    } catch (err) {
      console.error('Error loading users:', err);
      error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => 
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <AdminLayoutCorporate>
      <div className="admin-users">
        <header className="admin-page-header">
          <h1>User Management</h1>
          <p>Manage all registered users in the system</p>
          <div className="admin-notice">
            <strong>ℹ️ Hinweis:</strong> Zeigt alle registrierten User an. User mit "Pending Onboarding" haben sich registriert aber das Onboarding noch nicht abgeschlossen.
          </div>
        </header>

        <div className="admin-users-controls corporate-controls">
          <div className="search-section">
            <div className="search-box">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search users by email, username, or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="admin-search-input corporate-search"
              />
            </div>
          </div>
          <div className="control-actions">
            <Button onClick={loadUsers} variant="outline">
              🔄 Refresh
            </Button>
            <Button variant="primary">
              ➕ Add User
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="admin-loading">
            <p>Loading users...</p>
          </div>
        ) : (
          <div className="admin-users-content">
            <div className="users-stats corporate-stats">
              <div className="stats-card">
                <div className="stats-icon">👥</div>
                <div className="stats-content">
                  <div className="stats-number">{users.length}</div>
                  <div className="stats-label">Total Users</div>
                </div>
              </div>
              <div className="stats-card">
                <div className="stats-icon">✅</div>
                <div className="stats-content">
                  <div className="stats-number">{users.filter(u => u.profile_created_at).length}</div>
                  <div className="stats-label">Onboarded</div>
                </div>
              </div>
              <div className="stats-card">
                <div className="stats-icon">⏳</div>
                <div className="stats-content">
                  <div className="stats-number">{users.filter(u => !u.profile_created_at).length}</div>
                  <div className="stats-label">Pending</div>
                </div>
              </div>
              {searchTerm && (
                <div className="search-info">
                  <span className="search-term">"{searchTerm}"</span>
                </div>
              )}
            </div>

            <div className="users-table-container">
              <table className="admin-table corporate-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Contact</th>
                    <th>Status</th>
                    <th>Registered</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id}>
                      <td className="user-info-cell">
                        <div className="user-avatar">
                          {(user.full_name || user.username || user.email).charAt(0).toUpperCase()}
                        </div>
                        <div className="user-details">
                          <div className="user-name">
                            {user.full_name || user.username || 'Unnamed User'}
                          </div>
                          <div className="user-username">
                            {user.username ? `@${user.username}` : 'No username'}
                          </div>
                        </div>
                      </td>
                      <td className="user-contact">
                        <div className="user-email">{user.email}</div>
                      </td>
                      <td className="user-status">
                        {user.profile_created_at ? (
                          <span className="status-badge active">Onboarded</span>
                        ) : (
                          <span className="status-badge pending">Pending Onboarding</span>
                        )}
                      </td>
                      <td className="user-created">
                        <div className="date-info">
                          <div className="date-primary">{formatDate(user.created_at).split(' ')[0]}</div>
                          <div className="date-secondary">{formatDate(user.created_at).split(' ')[1]}</div>
                        </div>
                      </td>
                      <td className="user-actions">
                        <div className="action-buttons">
                          <Button 
                            size="small" 
                            variant="outline"
                            onClick={() => success('User details feature coming soon!')}
                          >
                            �️ View
                          </Button>
                          <Button 
                            size="small" 
                            variant="outline"
                            onClick={() => success('Edit feature coming soon!')}
                          >
                            ✏️ Edit
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredUsers.length === 0 && !loading && (
                <div className="no-users">
                  <p>
                    {searchTerm 
                      ? `No users found matching "${searchTerm}"` 
                      : 'No users registered yet'
                    }
                  </p>
                </div>
              )}
            </div>

            {/* Debug: Zeige alle geladenen User als JSON */}
            <div style={{ margin: '2rem 0', padding: '1rem', background: '#f9f9f9', border: '1px solid #eee', fontSize: '0.9em', color: '#333' }}>
              <strong>Debug: Alle geladenen User (Rohdaten)</strong>
              <pre>{JSON.stringify(users, null, 2)}</pre>
            </div>
          </div>
        )}
      </div>
    </AdminLayoutCorporate>
  );
}