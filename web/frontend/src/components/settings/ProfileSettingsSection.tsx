import React, { useState, useRef } from 'react';
import Button from '../ui/Button';
import type { ProfileSettingsProps } from './types/settings';
import { uploadAvatar, removeAvatar } from '../../lib/services/avatarService';
import { useToast } from '../../hooks/useToast';
import ProfilePrivacyToggles from './ProfilePrivacyToggles';

const ProfileSettingsSection: React.FC<ProfileSettingsProps> = ({ profileData, setProfileData, isUpdating, handleProfileSave }) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { success, error } = useToast();

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const result = await uploadAvatar(file);
    setUploading(false);

    if (result.success && result.avatarUrl) {
      setProfileData(prev => ({ ...prev, avatarUrl: result.avatarUrl! }));
      success('✅ Profilbild erfolgreich hochgeladen!');

      // Trigger page reload to update avatar everywhere
      setTimeout(() => window.location.reload(), 1000);
    } else {
      error(`❌ Upload fehlgeschlagen: ${result.error}`);
    }

    // Clear input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAvatarRemove = async () => {
    if (!confirm('Profilbild wirklich entfernen?')) return;

    setUploading(true);
    const result = await removeAvatar();
    setUploading(false);

    if (result.success) {
      setProfileData(prev => ({ ...prev, avatarUrl: '' }));
      success('✅ Profilbild entfernt!');

      // Trigger page reload to update avatar everywhere
      setTimeout(() => window.location.reload(), 1000);
    } else {
      error(`❌ Entfernen fehlgeschlagen: ${result.error}`);
    }
  };

  return (
  <div className="content-card">
    <div className="card-header">
      <h2 className="card-title">👤 Profil Informationen</h2>
      <p className="card-subtitle">Verwalten Sie Ihre persönlichen Informationen und Kontodaten</p>
    </div>
    <form onSubmit={handleProfileSave} className="settings-form">
      <div className="form-section">
        <h3 className="section-title">Profilbild</h3>
        <div className={`avatar-upload ${uploading ? 'avatar-uploading' : ''}`}>
          <div className="avatar-preview-container">
            <div className="avatar-preview">
              {profileData.avatarUrl ? (
                <img src={profileData.avatarUrl} alt="Avatar" />
              ) : (
                <div className="avatar-placeholder">
                  {(profileData.firstName || '?')[0].toUpperCase()}
                </div>
              )}
            </div>
            <div className="avatar-actions">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                disabled={uploading}
                className="avatar-upload-input"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="avatar-upload-btn"
              >
                {uploading ? '⏳ Lade hoch...' : '📷 Profilbild hochladen'}
              </button>
              {profileData.avatarUrl && (
                <button
                  type="button"
                  onClick={handleAvatarRemove}
                  disabled={uploading}
                  className="avatar-remove-btn"
                >
                  🗑️ Entfernen
                </button>
              )}
            </div>
          </div>
          <p className="avatar-upload-hint">
            <strong>Empfohlen:</strong> Quadratisches Bild, min. 512x512px. Max. 5MB.
          </p>
        </div>
      </div>

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

      {/* Privacy Settings */}
      <div className="privacy-section-divider" style={{ margin: '2rem 0', borderTop: '1px solid var(--border-color)' }}></div>
      <ProfilePrivacyToggles />
    </form>
  </div>
  );
};

export default ProfileSettingsSection;
