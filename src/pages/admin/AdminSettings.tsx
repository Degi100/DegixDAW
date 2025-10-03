// src/pages/admin/AdminSettings.tsx
// Comprehensive Admin Settings Page - Refactored with Modular Panels

import { useState, useCallback } from 'react';
import AdminLayoutCorporate from '../../components/admin/AdminLayoutCorporate';
import { useTheme } from '../../hooks/useTheme';
import { useToast } from '../../hooks/useToast';
import { MockDataBadge } from '../../components/admin/MockDataBadge';

// Panel Components
import SystemInfoPanel from './components/panels/SystemInfoPanel';
import SecuritySettingsPanel from './components/panels/SecuritySettingsPanel';
import ApplicationSettingsPanel from './components/panels/ApplicationSettingsPanel';
import NotificationSettingsPanel from './components/panels/NotificationSettingsPanel';

import type {
  SystemInfo,
  SecuritySettings,
  AppSettings,
  NotificationSettings
} from './types/admin.types';

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

  // ============================================
  // HANDLERS
  // ============================================

  const handleSaveSettings = useCallback(async () => {
    setIsSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      success('Einstellungen erfolgreich gespeichert!');
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setIsSaving(false);
    }
  }, [success]);

  const handleTestEmail = useCallback(async () => {
    try {
      success('Test-E-Mail erfolgreich gesendet!');
    } catch (err) {
      console.error('Failed to send test email:', err);
    }
  }, [success]);

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleResetSecurity = () => {
    setSecuritySettings({
      sessionTimeout: 30,
      minPasswordLength: 8,
      requireSpecialChars: true,
      require2FA: false,
      maxLoginAttempts: 5,
      lockoutDuration: 15
    });
  };

  const handleResetApp = () => {
    setAppSettings({
      maintenanceMode: false,
      allowRegistration: true,
      defaultUserRole: 'user',
      maxFileUploadSize: 10,
      requireEmailVerification: true
    });
  };

  const handleResetNotifications = () => {
    setNotificationSettings({
      adminNotifications: true,
      userWelcomeEmail: true,
      systemAlerts: true,
      weeklyReports: false
    });
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

        {/* Tab Content - Now with Panel Components */}
        <div className="settings-content">
          {activeTab === 'system' && (
            <SystemInfoPanel
              systemInfo={systemInfo}
              onRefresh={handleRefresh}
              onTestEmail={handleTestEmail}
            />
          )}

          {activeTab === 'security' && (
            <SecuritySettingsPanel
              settings={securitySettings}
              onChange={setSecuritySettings}
              onSave={handleSaveSettings}
              onReset={handleResetSecurity}
              isSaving={isSaving}
            />
          )}

          {activeTab === 'app' && (
            <ApplicationSettingsPanel
              settings={appSettings}
              onChange={setAppSettings}
              onSave={handleSaveSettings}
              onReset={handleResetApp}
              isSaving={isSaving}
            />
          )}

          {activeTab === 'notifications' && (
            <NotificationSettingsPanel
              settings={notificationSettings}
              onChange={setNotificationSettings}
              onSave={handleSaveSettings}
              onReset={handleResetNotifications}
              isSaving={isSaving}
            />
          )}
        </div>
      </div>
    </AdminLayoutCorporate>
  );
}
