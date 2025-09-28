import React from 'react';
import Button from '../ui/Button';
import type { SecuritySettingsProps } from './types/settings';

const SecuritySettingsSection: React.FC<SecuritySettingsProps> = ({ securityData, setSecurityData, isUpdating, handlePasswordChange, handleEmailChange, userEmail }) => (
  <div className="content-card">
    <div className="card-header">
      <h2 className="card-title">🔒 Sicherheit</h2>
      <p className="card-subtitle">Passwort und E-Mail-Adresse verwalten</p>
    </div>
    <div className="settings-section">
      <h3 className="section-title">Passwort ändern</h3>
      <form onSubmit={handlePasswordChange} className="settings-form">
        <div className="form-grid">
          <div className="input-group">
            <label className="input-label">Aktuelles Passwort *</label>
            <input
              type="password"
              value={securityData.currentPassword}
              onChange={e => setSecurityData(prev => ({ ...prev, currentPassword: e.target.value }))}
              className="settings-input"
              placeholder="Ihr aktuelles Passwort"
              required
            />
          </div>
          <div className="input-group">
            <label className="input-label">Neues Passwort *</label>
            <input
              type="password"
              value={securityData.newPassword}
              onChange={e => setSecurityData(prev => ({ ...prev, newPassword: e.target.value }))}
              className="settings-input"
              placeholder="Neues Passwort eingeben"
              minLength={6}
              required
            />
          </div>
          <div className="input-group">
            <label className="input-label">Passwort bestätigen *</label>
            <input
              type="password"
              value={securityData.confirmPassword}
              onChange={e => setSecurityData(prev => ({ ...prev, confirmPassword: e.target.value }))}
              className="settings-input"
              placeholder="Neues Passwort wiederholen"
              minLength={6}
              required
            />
          </div>
        </div>
        <div className="form-actions">
          <Button
            type="submit"
            variant="primary"
            disabled={isUpdating}
          >
            {isUpdating ? '⏳ Ändern...' : '🔑 Passwort ändern'}
          </Button>
        </div>
      </form>
    </div>
    <div className="settings-section">
      <h3 className="section-title">E-Mail-Adresse ändern</h3>
      <form onSubmit={handleEmailChange} className="settings-form">
        <div className="form-grid">
          <div className="input-group">
            <label className="input-label">Aktuelle E-Mail</label>
            <input
              type="email"
              value={userEmail}
              className="settings-input"
              disabled
            />
          </div>
          <div className="input-group">
            <label className="input-label">Neue E-Mail-Adresse *</label>
            <input
              type="email"
              value={securityData.newEmail}
              onChange={e => setSecurityData(prev => ({ ...prev, newEmail: e.target.value }))}
              className="settings-input"
              placeholder="neue@email.de"
              required
            />
          </div>
          <div className="input-group">
            <label className="input-label">Passwort bestätigen *</label>
            <input
              type="password"
              value={securityData.currentPassword}
              onChange={e => setSecurityData(prev => ({ ...prev, currentPassword: e.target.value }))}
              className="settings-input"
              placeholder="Ihr aktuelles Passwort"
              required
            />
          </div>
        </div>
        <div className="form-actions">
          <Button
            type="submit"
            variant="primary"
            disabled={isUpdating}
          >
            {isUpdating ? '⏳ Ändern...' : '📧 E-Mail ändern'}
          </Button>
        </div>
      </form>
    </div>
  </div>
);

export default SecuritySettingsSection;
