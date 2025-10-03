// src/pages/admin/components/panels/ApplicationSettingsPanel.tsx
// Application Settings Configuration Panel

import Button from '../../../../components/ui/Button';
import type { AppSettingsPanelProps } from '../../types/admin.types';

export default function ApplicationSettingsPanel({
  settings,
  onChange,
  onSave,
  onReset,
  isSaving
}: AppSettingsPanelProps) {
  return (
    <div className="settings-section">
      <h2 className="section-title">Application Settings</h2>
      <p className="section-description">Configure general application behavior</p>

      <div className="settings-form">
        <div className="form-group">
          <label>Default User Role</label>
          <select
            value={settings.defaultUserRole}
            onChange={(e) => onChange({
              ...settings,
              defaultUserRole: e.target.value as 'user' | 'moderator' | 'admin'
            })}
          >
            <option value="user">User</option>
            <option value="moderator">Moderator</option>
            <option value="admin">Admin</option>
          </select>
          <small>Default role assigned to new registrations</small>
        </div>

        <div className="form-group">
          <label>Max File Upload Size (MB)</label>
          <input
            type="number"
            value={settings.maxFileUploadSize}
            onChange={(e) => onChange({
              ...settings,
              maxFileUploadSize: parseInt(e.target.value)
            })}
            min="1"
            max="100"
          />
          <small>Maximum file size for user uploads</small>
        </div>

        <div className="form-group checkbox">
          <label>
            <input
              type="checkbox"
              checked={settings.maintenanceMode}
              onChange={(e) => onChange({
                ...settings,
                maintenanceMode: e.target.checked
              })}
            />
            <span>Maintenance Mode</span>
          </label>
          <small>⚠️ Disables access for non-admin users</small>
        </div>

        <div className="form-group checkbox">
          <label>
            <input
              type="checkbox"
              checked={settings.allowRegistration}
              onChange={(e) => onChange({
                ...settings,
                allowRegistration: e.target.checked
              })}
            />
            <span>Allow New Registrations</span>
          </label>
          <small>Enable or disable user registration</small>
        </div>

        <div className="form-group checkbox">
          <label>
            <input
              type="checkbox"
              checked={settings.requireEmailVerification}
              onChange={(e) => onChange({
                ...settings,
                requireEmailVerification: e.target.checked
              })}
            />
            <span>Require Email Verification</span>
          </label>
          <small>Users must verify email before accessing the app</small>
        </div>
      </div>

      <div className="action-buttons">
        <Button variant="outline" onClick={onReset}>
          ↺ Reset to Defaults
        </Button>
        <Button variant="primary" onClick={onSave} disabled={isSaving}>
          {isSaving ? '💾 Saving...' : '💾 Save Application Settings'}
        </Button>
      </div>
    </div>
  );
}
