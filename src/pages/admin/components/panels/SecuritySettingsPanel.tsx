// src/pages/admin/components/panels/SecuritySettingsPanel.tsx
// Security Configuration Panel

import Button from '../../../../components/ui/Button';
import type { SecuritySettingsPanelProps } from '../../types/admin.types';

export default function SecuritySettingsPanel({
  settings,
  onChange,
  onSave,
  onReset,
  isSaving
}: SecuritySettingsPanelProps) {
  return (
    <div className="settings-section">
      <h2 className="section-title">Security Settings</h2>
      <p className="section-description">Configure authentication and security policies</p>

      <div className="settings-form">
        <div className="form-group">
          <label>Session Timeout (minutes)</label>
          <input
            type="number"
            value={settings.sessionTimeout}
            onChange={(e) => onChange({
              ...settings,
              sessionTimeout: parseInt(e.target.value)
            })}
            min="5"
            max="1440"
          />
          <small>How long users stay logged in without activity</small>
        </div>

        <div className="form-group">
          <label>Minimum Password Length</label>
          <input
            type="number"
            value={settings.minPasswordLength}
            onChange={(e) => onChange({
              ...settings,
              minPasswordLength: parseInt(e.target.value)
            })}
            min="6"
            max="32"
          />
          <small>Minimum characters required for passwords</small>
        </div>

        <div className="form-group">
          <label>Maximum Login Attempts</label>
          <input
            type="number"
            value={settings.maxLoginAttempts}
            onChange={(e) => onChange({
              ...settings,
              maxLoginAttempts: parseInt(e.target.value)
            })}
            min="3"
            max="10"
          />
          <small>Failed attempts before account lockout</small>
        </div>

        <div className="form-group">
          <label>Lockout Duration (minutes)</label>
          <input
            type="number"
            value={settings.lockoutDuration}
            onChange={(e) => onChange({
              ...settings,
              lockoutDuration: parseInt(e.target.value)
            })}
            min="5"
            max="1440"
          />
          <small>How long accounts remain locked after failed attempts</small>
        </div>

        <div className="form-group checkbox">
          <label>
            <input
              type="checkbox"
              checked={settings.requireSpecialChars}
              onChange={(e) => onChange({
                ...settings,
                requireSpecialChars: e.target.checked
              })}
            />
            <span>Require Special Characters in Passwords</span>
          </label>
          <small>Force users to include special characters (!@#$%^&*)</small>
        </div>

        <div className="form-group checkbox">
          <label>
            <input
              type="checkbox"
              checked={settings.require2FA}
              onChange={(e) => onChange({
                ...settings,
                require2FA: e.target.checked
              })}
            />
            <span>Require Two-Factor Authentication</span>
          </label>
          <small>Enforce 2FA for all user accounts</small>
        </div>
      </div>

      <div className="action-buttons">
        <Button variant="outline" onClick={onReset}>
          ↺ Reset to Defaults
        </Button>
        <Button variant="primary" onClick={onSave} disabled={isSaving}>
          {isSaving ? '💾 Saving...' : '💾 Save Security Settings'}
        </Button>
      </div>
    </div>
  );
}
