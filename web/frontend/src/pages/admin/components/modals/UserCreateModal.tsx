// src/pages/admin/components/modals/UserCreateModal.tsx
// Create New User Modal with Form

import { useState } from 'react';
import Button from '../../../../components/ui/Button';
import type { UserCreateModalProps, NewUserData } from '../../types/admin.types';

const initialUserData: NewUserData = {
  email: '',
  password: '',
  full_name: '',
  username: '',
  role: 'user',
  phone: '',
  sendWelcomeEmail: true
};

export default function UserCreateModal({
  isOpen,
  onClose,
  onCreateUser
}: UserCreateModalProps) {
  const [userData, setUserData] = useState<NewUserData>(initialUserData);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    await onCreateUser(userData);
    setUserData(initialUserData); // Reset form
    onClose();
  };

  const handleClose = () => {
    setUserData(initialUserData); // Reset on close
    onClose();
  };

  const isValid = userData.email && userData.password && userData.full_name;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>➕ Create New User</h3>
          <button className="modal-close" onClick={handleClose}>×</button>
        </div>
        
        <div className="modal-body">
          <div className="form-grid">
            <div className="form-group">
              <label>Email *</label>
              <input
                type="email"
                value={userData.email}
                onChange={(e) => setUserData({ ...userData, email: e.target.value })}
                placeholder="user@example.com"
                required
              />
            </div>
            
            <div className="form-group">
              <label>Password *</label>
              <input
                type="password"
                value={userData.password}
                onChange={(e) => setUserData({ ...userData, password: e.target.value })}
                placeholder="Minimum 6 characters"
                required
              />
            </div>
            
            <div className="form-group">
              <label>Full Name *</label>
              <input
                type="text"
                value={userData.full_name}
                onChange={(e) => setUserData({ ...userData, full_name: e.target.value })}
                placeholder="John Doe"
                required
              />
            </div>
            
            <div className="form-group">
              <label>Username</label>
              <input
                type="text"
                value={userData.username}
                onChange={(e) => setUserData({ ...userData, username: e.target.value })}
                placeholder="johndoe"
              />
            </div>
            
            <div className="form-group">
              <label>Role</label>
              <select
                value={userData.role}
                onChange={(e) => setUserData({ ...userData, role: e.target.value as 'admin' | 'user' | 'moderator' })}
              >
                <option value="user">User</option>
                <option value="moderator">Moderator</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>Phone</label>
              <input
                type="tel"
                value={userData.phone}
                onChange={(e) => setUserData({ ...userData, phone: e.target.value })}
                placeholder="+49 123 456789"
              />
            </div>
          </div>
          
          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={userData.sendWelcomeEmail}
                onChange={(e) => setUserData({ ...userData, sendWelcomeEmail: e.target.checked })}
              />
              Send welcome email to user
            </label>
          </div>
        </div>
        
        <div className="modal-footer">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={!isValid}
          >
            Create User
          </Button>
        </div>
      </div>
    </div>
  );
}
