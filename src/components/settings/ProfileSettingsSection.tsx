import React from 'react';
import Button from '../ui/Button';
import type { ProfileSettingsProps } from './types/settings';

const ProfileSettingsSection: React.FC<ProfileSettingsProps> = ({ profileData, setProfileData, isUpdating, handleProfileSave }) => (
  <div className="content-card">
    <div className="card-header">
      <h2 className="card-title">👤 Profil Informationen</h2>
      <p className="card-subtitle">Verwalten Sie Ihre persönlichen Informationen und Kontodaten</p>
    </div>
    <form onSubmit={handleProfileSave} className="settings-form">
      <div className="form-section">
        <h3 className="section-title">Persönliche Informationen</h3>
        <div className="form-grid">
          <div className="input-group">
            <label className="input-label">Vorname *</label>
            <input
              type="text"
              value={profileData.firstName}
              onChange={e => setProfileData(prev => ({ ...prev, firstName: e.target.value }))}
              className="settings-input"
              placeholder="Ihr Vorname"
              required
            />
          </div>
          <div className="input-group">
            <label className="input-label">Nachname *</label>
            <input
              type="text"
              value={profileData.lastName}
              onChange={e => setProfileData(prev => ({ ...prev, lastName: e.target.value }))}
              className="settings-input"
              placeholder="Ihr Nachname"
              required
            />
          </div>
          <div className="input-group">
            <label className="input-label">Benutzername</label>
            <input
              type="text"
              value={profileData.username}
              onChange={e => setProfileData(prev => ({ ...prev, username: e.target.value }))}
              className="settings-input"
              placeholder="@benutzername"
            />
          </div>
          <div className="input-group">
            <label className="input-label">Anzeigename</label>
            <input
              type="text"
              value={profileData.displayName}
              onChange={e => setProfileData(prev => ({ ...prev, displayName: e.target.value }))}
              className="settings-input"
              placeholder="Öffentlich sichtbarer Name"
            />
          </div>
          <div className="input-group full-width">
            <label className="input-label">Vollständiger Name (automatisch generiert)</label>
            <input
              type="text"
              value={`${profileData.firstName} ${profileData.lastName}`.trim() || profileData.fullName}
              className="settings-input readonly-input"
              placeholder="Wird aus Vor- und Nachname generiert"
              readOnly
            />
          </div>
          <div className="input-group full-width">
            <label className="input-label">Biografie (optional)</label>
            <textarea
              value={profileData.bio}
              onChange={e => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
              className="settings-textarea"
              placeholder="Erzählen Sie etwas über sich..."
              rows={3}
              maxLength={500}
            />
            <small className="char-counter">{profileData.bio.length}/500 Zeichen</small>
          </div>
        </div>
      </div>
      <div className="form-actions">
        <Button
          type="submit"
          variant="primary"
          size="large"
          disabled={isUpdating}
        >
          {isUpdating ? '⏳ Speichern...' : '✓ Profil speichern'}
        </Button>
      </div>
    </form>
  </div>
);

export default ProfileSettingsSection;
