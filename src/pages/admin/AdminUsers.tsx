// src/pages/admin/AdminUsers.tsx
// User management page for admins

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import AdminLayout from '../../components/admin/AdminLayout';
import { useToast } from '../../hooks/useToast';
import Button from '../../components/ui/Button';

interface UserProfile {
  id: string;
  username: string | null;
  full_name: string | null;
  email: string;
  created_at: string;
  updated_at: string;
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
      
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setUsers(data || []);
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
    <AdminLayout>
      <div className="admin-users">
        <header className="admin-page-header">
          <h1>User Management</h1>
          <p>Manage all registered users in the system</p>
        </header>

        <div className="admin-users-controls">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search users by email, username, or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="admin-search-input"
            />
          </div>
          <Button onClick={loadUsers} variant="outline">
            🔄 Refresh
          </Button>
        </div>

        {loading ? (
          <div className="admin-loading">
            <p>Loading users...</p>
          </div>
        ) : (
          <div className="admin-users-content">
            <div className="users-stats">
              <p>
                Showing {filteredUsers.length} of {users.length} users
                {searchTerm && ` matching "${searchTerm}"`}
              </p>
            </div>

            <div className="users-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Username</th>
                    <th>Full Name</th>
                    <th>Registered</th>
                    <th>Last Updated</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id}>
                      <td className="user-email">{user.email}</td>
                      <td className="user-username">
                        {user.username ? `@${user.username}` : '—'}
                      </td>
                      <td className="user-fullname">
                        {user.full_name || '—'}
                      </td>
                      <td className="user-created">
                        {formatDate(user.created_at)}
                      </td>
                      <td className="user-updated">
                        {formatDate(user.updated_at)}
                      </td>
                      <td className="user-actions">
                        <Button 
                          size="small" 
                          variant="outline"
                          onClick={() => success('User details feature coming soon!')}
                        >
                          📝 View
                        </Button>
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
          </div>
        )}
      </div>
    </AdminLayout>
  );
}