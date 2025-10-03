// src/pages/admin/components/modals/BulkActionsModal.tsx
// Bulk Operations Modal for multiple users

import Button from '../../../../components/ui/Button';
import type { BulkActionsModalProps } from '../../types/admin.types';

export default function BulkActionsModal({
  isOpen,
  onClose,
  selectedCount,
  onBulkActivate,
  onBulkDeactivate,
  onBulkDelete
}: BulkActionsModalProps) {
  if (!isOpen || selectedCount === 0) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>⚡ Bulk Actions</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          <p>Apply action to {selectedCount} selected users:</p>
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
