// src/pages/admin/AdminSettings.tsx
// Comprehensive Admin Settings Page

import { useState, useCallback } from 'react';
import AdminLayoutCorporate from '../../components/admin/AdminLayoutCorporate';
import { useTheme } from '../../hooks/useTheme';
import { useToast } from '../../hooks/useToast';
import Button from '../../components/ui/Button';
import { MockDataBadge } from '../../components/admin/MockDataBadge';

interface SystemInfo {
  appVersion: string;
  dbStatus: 'connected' | 'disconnected' | 'error';
  apiStatus: 'online' | 'offline' | 'degraded';
  lastBackup: string;
  totalUsers: number;
  totalStorage: string;
}

interface SecuritySettings {
  sessionTimeout: number;
  minPasswordLength: number;
  requireSpecialChars: boolean;
  require2FA: boolean;
  maxLoginAttempts: number;
  lockoutDuration: number;
}

interface AppSettings {
  maintenanceMode: boolean;
  allowRegistration: boolean;
  defaultUserRole: 'user' | 'moderator' | 'admin';
  maxFileUploadSize: number;
  requireEmailVerification: boolean;
}

interface NotificationSettings {
  adminNotifications: boolean;
  userWelcomeEmail: boolean;
  systemAlerts: boolean;
  weeklyReports: boolean;
}

export default function AdminSettings() {
  const { theme } = useTheme();
  const { success } = useToast();

  // System Info (read-only)
  const [systemInfo] = useState<SystemInfo>({
    appVersion: '1.0.0',
    dbStatus: 'connected',
    apiStatus: 'online',
    lastBackup: new Date().toISOString(),
    totalUsers: 4,
    totalStorage: '2.3 GB'
  });

  // Settings States
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    sessionTimeout: 30,
    minPasswordLength: 8,
    requireSpecialChars: true,
    require2FA: false,
    maxLoginAttempts: 5,
    lockoutDuration: 15
  });

  const [appSettings, setAppSettings] = useState<AppSettings>({
    maintenanceMode: false,
    allowRegistration: true,
    defaultUserRole: 'user',
    maxFileUploadSize: 10,
    requireEmailVerification: true
  });

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    adminNotifications: true,
    userWelcomeEmail: true,
    systemAlerts: true,
    weeklyReports: false
  });

  const [activeTab, setActiveTab] = useState<'system' | 'security' | 'app' | 'notifications'>('system');
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveSettings = useCallback(async () => {
    setIsSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      success('Settings saved successfully!');
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setIsSaving(false);
    }
  }, [success]);

  const handleTestEmail = useCallback(async () => {
    try {
      success('Test email sent successfully!');
    } catch (err) {
      console.error('Failed to send test email:', err);
    }
  }, [success]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
      case 'online':
        return 'success';
      case 'disconnected':
      case 'offline':
        return 'danger';
      case 'degraded':
      case 'error':
        return 'warning';
      default:
        return 'secondary';
    }
  };

  return (
    <AdminLayoutCorporate>
      <div className={`admin-settings ${theme}`}>
        <header className="admin-page-header">
          <h1>⚙️ System Settings</h1>
          <p>Configure system-wide settings and preferences</p>
        </header>

        {/* Mock Data Warning Banner */}
        <MockDataBadge 
          variant="banner"
          message="⚠️ Diese Einstellungen können aktuell noch nicht gespeichert werden. Das Backend befindet sich in Entwicklung."
          tooltip="Alle Änderungen hier sind nur temporär und werden beim Neuladen zurückgesetzt"
        />

        {/* Tabs Navigation */}
        <div className="settings-tabs">
          <button
            className={`settings-tab ${activeTab === 'system' ? 'active' : ''}`}
            onClick={() => setActiveTab('system')}
          >
            <span className="tab-icon">💻</span>
            <span className="tab-label">System Info</span>
          </button>
          <button
            className={`settings-tab ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            <span className="tab-icon">🔒</span>
            <span className="tab-label">Security</span>
          </button>
          <button
            className={`settings-tab ${activeTab === 'app' ? 'active' : ''}`}
            onClick={() => setActiveTab('app')}
          >
            <span className="tab-icon">🎛️</span>
            <span className="tab-label">Application</span>
          </button>
          <button
            className={`settings-tab ${activeTab === 'notifications' ? 'active' : ''}`}
            onClick={() => setActiveTab('notifications')}
          >
            <span className="tab-icon">🔔</span>
            <span className="tab-label">Notifications</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="settings-content">
          {/* System Info Tab */}
          {activeTab === 'system' && (
            <div className="settings-section">
              <h2 className="section-title">System Information</h2>
              <p className="section-description">Read-only system status and information</p>

              <div className="info-grid">
                <div className="info-card">
                  <div className="info-icon">📦</div>
                  <div className="info-content">
                    <div className="info-label">Application Version</div>
                    <div className="info-value">{systemInfo.appVersion}</div>
                  </div>
                </div>

                <div className="info-card">
                  <div className="info-icon">🗄️</div>
                  <div className="info-content">
                    <div className="info-label">Database Status</div>
                    <div className="info-value">
                      <span className={`status-badge ${getStatusColor(systemInfo.dbStatus)}`}>
                        {systemInfo.dbStatus}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="info-card">
                  <div className="info-icon">🌐</div>
                  <div className="info-content">
                    <div className="info-label">API Status</div>
                    <div className="info-value">
                      <span className={`status-badge ${getStatusColor(systemInfo.apiStatus)}`}>
                        {systemInfo.apiStatus}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="info-card">
                  <div className="info-icon">💾</div>
                  <div className="info-content">
                    <div className="info-label">Last Backup</div>
                    <div className="info-value">
                      {new Date(systemInfo.lastBackup).toLocaleString('de-DE')}
                    </div>
                  </div>
                </div>

                <div className="info-card">
                  <div className="info-icon">👥</div>
                  <div className="info-content">
                    <div className="info-label">Total Users</div>
                    <div className="info-value">{systemInfo.totalUsers.toLocaleString()}</div>
                  </div>
                </div>

                <div className="info-card">
                  <div className="info-icon">📊</div>
                  <div className="info-content">
                    <div className="info-label">Total Storage</div>
                    <div className="info-value">{systemInfo.totalStorage}</div>
                  </div>
                </div>
              </div>

              <div className="action-buttons">
                <Button variant="outline" onClick={() => window.location.reload()}>
                  🔄 Refresh Status
                </Button>
                <Button variant="outline" onClick={handleTestEmail}>
                  📧 Send Test Email
                </Button>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="settings-section">
              <h2 className="section-title">Security Settings</h2>
              <p className="section-description">Configure authentication and security policies</p>

              <div className="settings-form">
                <div className="form-group">
                  <label>Session Timeout (minutes)</label>
                  <input
                    type="number"
                    value={securitySettings.sessionTimeout}
                    onChange={(e) => setSecuritySettings({
                      ...securitySettings,
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
                    value={securitySettings.minPasswordLength}
                    onChange={(e) => setSecuritySettings({
                      ...securitySettings,
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
                    value={securitySettings.maxLoginAttempts}
                    onChange={(e) => setSecuritySettings({
                      ...securitySettings,
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
                    value={securitySettings.lockoutDuration}
                    onChange={(e) => setSecuritySettings({
                      ...securitySettings,
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
                      checked={securitySettings.requireSpecialChars}
                      onChange={(e) => setSecuritySettings({
                        ...securitySettings,
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
                      checked={securitySettings.require2FA}
                      onChange={(e) => setSecuritySettings({
                        ...securitySettings,
                        require2FA: e.target.checked
                      })}
                    />
                    <span>Require Two-Factor Authentication</span>
                  </label>
                  <small>Enforce 2FA for all user accounts</small>
                </div>
              </div>

              <div className="action-buttons">
                <Button variant="outline" onClick={() => setSecuritySettings({
                  sessionTimeout: 30,
                  minPasswordLength: 8,
                  requireSpecialChars: true,
                  require2FA: false,
                  maxLoginAttempts: 5,
                  lockoutDuration: 15
                })}>
                  ↺ Reset to Defaults
                </Button>
                <Button variant="primary" onClick={handleSaveSettings} disabled={isSaving}>
                  {isSaving ? '💾 Saving...' : '💾 Save Security Settings'}
                </Button>
              </div>
            </div>
          )}

          {/* Application Tab */}
          {activeTab === 'app' && (
            <div className="settings-section">
              <h2 className="section-title">Application Settings</h2>
              <p className="section-description">Configure general application behavior</p>

              <div className="settings-form">
                <div className="form-group">
                  <label>Default User Role</label>
                  <select
                    value={appSettings.defaultUserRole}
                    onChange={(e) => setAppSettings({
                      ...appSettings,
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
                    value={appSettings.maxFileUploadSize}
                    onChange={(e) => setAppSettings({
                      ...appSettings,
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
                      checked={appSettings.maintenanceMode}
                      onChange={(e) => setAppSettings({
                        ...appSettings,
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
                      checked={appSettings.allowRegistration}
                      onChange={(e) => setAppSettings({
                        ...appSettings,
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
                      checked={appSettings.requireEmailVerification}
                      onChange={(e) => setAppSettings({
                        ...appSettings,
                        requireEmailVerification: e.target.checked
                      })}
                    />
                    <span>Require Email Verification</span>
                  </label>
                  <small>Users must verify email before accessing the app</small>
                </div>
              </div>

              <div className="action-buttons">
                <Button variant="outline" onClick={() => setAppSettings({
                  maintenanceMode: false,
                  allowRegistration: true,
                  defaultUserRole: 'user',
                  maxFileUploadSize: 10,
                  requireEmailVerification: true
                })}>
                  ↺ Reset to Defaults
                </Button>
                <Button variant="primary" onClick={handleSaveSettings} disabled={isSaving}>
                  {isSaving ? '💾 Saving...' : '💾 Save Application Settings'}
                </Button>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="settings-section">
              <h2 className="section-title">Notification Settings</h2>
              <p className="section-description">Configure email notifications and alerts</p>

              <div className="settings-form">
                <div className="form-group checkbox">
                  <label>
                    <input
                      type="checkbox"
                      checked={notificationSettings.adminNotifications}
                      onChange={(e) => setNotificationSettings({
                        ...notificationSettings,
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
                      checked={notificationSettings.userWelcomeEmail}
                      onChange={(e) => setNotificationSettings({
                        ...notificationSettings,
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
                      checked={notificationSettings.systemAlerts}
                      onChange={(e) => setNotificationSettings({
                        ...notificationSettings,
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
                      checked={notificationSettings.weeklyReports}
                      onChange={(e) => setNotificationSettings({
                        ...notificationSettings,
                        weeklyReports: e.target.checked
                      })}
                    />
                    <span>Weekly Reports</span>
                  </label>
                  <small>Receive weekly summary reports via email</small>
                </div>
              </div>

              <div className="action-buttons">
                <Button variant="outline" onClick={() => setNotificationSettings({
                  adminNotifications: true,
                  userWelcomeEmail: true,
                  systemAlerts: true,
                  weeklyReports: false
                })}>
                  ↺ Reset to Defaults
                </Button>
                <Button variant="primary" onClick={handleSaveSettings} disabled={isSaving}>
                  {isSaving ? '💾 Saving...' : '💾 Save Notification Settings'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayoutCorporate>
  );
}
