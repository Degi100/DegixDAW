// src/pages/admin/components/modals/BulkActionsModal.tsx
// Bulk Operations Modal for multiple users

import { useState } from 'react';
import Button from '../../../../components/ui/Button';
import type { BulkActionsModalProps } from '../../types/admin.types';

export default function BulkActionsModal({
  isOpen,
  onClose,
  selectedCount,
  onBulkActivate,
  onBulkDeactivate,
  onBulkDelete,
  onBulkRoleChange
}: BulkActionsModalProps) {
  const [selectedRole, setSelectedRole] = useState<'user' | 'beta_user' | 'moderator' | 'admin'>('user');

  if (!isOpen || selectedCount === 0) return null;

  const handleRoleChange = () => {
    onBulkRoleChange?.(selectedRole);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>⚡ Bulk Actions</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          <p>Apply action to {selectedCount} selected users:</p>

          {/* Role Change Section */}
          <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              🎭 Change Role
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as any)}
                style={{ flex: 1, padding: '0.5rem', borderRadius: '4px', border: '1px solid #ced4da' }}
              >
                <option value="user">User</option>
                <option value="beta_user">🧪 Beta Tester</option>
                <option value="moderator">Moderator</option>
                <option value="admin">Admin</option>
              </select>
              <Button variant="primary" onClick={handleRoleChange}>
                Apply
              </Button>
            </div>
          </div>

          {/* Other Bulk Actions */}
          <div className="bulk-actions">
            <Button variant="success" onClick={onBulkActivate}>
              ✅ Activate Users
            </Button>
            <Button variant="error" onClick={onBulkDeactivate}>
              ⏸️ Deactivate Users
            </Button>
            <Button
              variant="error"
              onClick={onBulkDelete}
              style={{ backgroundColor: '#dc3545', borderColor: '#dc3545' }}
            >
              🗑️ Delete Users
            </Button>
          </div>
        </div>
        
        <div className="modal-footer">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
