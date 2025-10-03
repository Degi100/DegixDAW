// src/pages/admin/components/panels/NotificationSettingsPanel.tsx
// Notification Preferences Panel

import Button from '../../../../components/ui/Button';
import type { NotificationSettingsPanelProps } from '../../types/admin.types';

export default function NotificationSettingsPanel({
  settings,
  onChange,
  onSave,
  onReset,
  isSaving
}: NotificationSettingsPanelProps) {
  return (
    <div className="settings-section">
      <h2 className="section-title">Notification Settings</h2>
      <p className="section-description">Configure email notifications and alerts</p>

      <div className="settings-form">
        <div className="form-group checkbox">
          <label>
            <input
              type="checkbox"
              checked={settings.adminNotifications}
              onChange={(e) => onChange({
                ...settings,
                adminNotifications: e.target.checked
              })}
            />
            <span>Admin Notifications</span>
          </label>
          <small>Receive emails about important admin events</small>
        </div>

        <div className="form-group checkbox">
          <label>
            <input
              type="checkbox"
              checked={settings.userWelcomeEmail}
              onChange={(e) => onChange({
                ...settings,
                userWelcomeEmail: e.target.checked
              })}
            />
            <span>User Welcome Emails</span>
          </label>
          <small>Send welcome emails to new users</small>
        </div>

        <div className="form-group checkbox">
          <label>
            <input
              type="checkbox"
              checked={settings.systemAlerts}
              onChange={(e) => onChange({
                ...settings,
                systemAlerts: e.target.checked
              })}
            />
            <span>System Alerts</span>
          </label>
          <small>Get notified about system errors and issues</small>
        </div>

        <div className="form-group checkbox">
          <label>
            <input
              type="checkbox"
              checked={settings.weeklyReports}
              onChange={(e) => onChange({
                ...settings,
                weeklyReports: e.target.checked
              })}
            />
            <span>Weekly Reports</span>
          </label>
          <small>Receive weekly summary reports via email</small>
        </div>
      </div>

      <div className="action-buttons">
        <Button variant="outline" onClick={onReset}>
          ↺ Reset to Defaults
        </Button>
        <Button variant="primary" onClick={onSave} disabled={isSaving}>
          {isSaving ? '💾 Saving...' : '💾 Save Notification Settings'}
        </Button>
      </div>
    </div>
  );
}
