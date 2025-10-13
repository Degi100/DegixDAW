import React from 'react';
import Button from '../ui/Button';
import Input from '../ui/Input';
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
          <Input
            label="Aktuelles Passwort *"
            type="password"
            value={securityData.currentPassword}
            onChange={e => setSecurityData(prev => ({ ...prev, currentPassword: e.target.value }))}
            placeholder="Ihr aktuelles Passwort"
            required
            showPasswordToggle={true}
          />
          <Input
            label="Neues Passwort *"
            type="password"
            value={securityData.newPassword}
            onChange={e => setSecurityData(prev => ({ ...prev, newPassword: e.target.value }))}
            placeholder="Neues Passwort eingeben"
            minLength={6}
            required
            showPasswordToggle={true}
          />
          <Input
            label="Passwort bestätigen *"
            type="password"
            value={securityData.confirmPassword}
            onChange={e => setSecurityData(prev => ({ ...prev, confirmPassword: e.target.value }))}
            placeholder="Neues Passwort wiederholen"
            minLength={6}
            required
            showPasswordToggle={true}
          />
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
            <Input
              type="password"
              value={securityData.currentPassword}
              onChange={e => setSecurityData(prev => ({ ...prev, currentPassword: e.target.value }))}
              placeholder="Ihr aktuelles Passwort"
              required
              showPasswordToggle={true}
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
