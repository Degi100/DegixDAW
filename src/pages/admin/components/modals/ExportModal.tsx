// src/pages/admin/components/modals/ExportModal.tsx
// Export Users Data Modal

import { useState } from 'react';
import Button from '../../../../components/ui/Button';
import type { ExportModalProps, ExportFormat } from '../../types/admin.types';

export default function ExportModal({
  isOpen,
  onClose,
  totalUsers,
  onExport
}: ExportModalProps) {
  const [exportFormat, setExportFormat] = useState<ExportFormat>('csv');

  if (!isOpen) return null;

  const handleExport = () => {
    onExport(exportFormat);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>📥 Export Users</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          <p>Export {totalUsers} users in the current filter:</p>
          <div className="form-group">
            <label>Export Format</label>
            <select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value as ExportFormat)}
            >
              <option value="csv">CSV (Spreadsheet)</option>
              <option value="json">JSON (Developer)</option>
            </select>
          </div>
          <div className="export-preview">
            <strong>Columns to export:</strong>
            <div className="export-columns">
              ID, Email, Full Name, Username, Role, Status, Created At, Last Sign In, Phone
            </div>
          </div>
        </div>
        
        <div className="modal-footer">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleExport}>
            📥 Export {exportFormat.toUpperCase()}
          </Button>
        </div>
      </div>
    </div>
  );
}
