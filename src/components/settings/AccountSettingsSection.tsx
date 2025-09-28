import React from 'react';
import Button from '../ui/Button';
import type { AccountSettingsProps } from './types/settings';

const AccountSettingsSection: React.FC<AccountSettingsProps> = ({ handleLogout, isUpdating }) => (
  <div className="content-card">
    <div className="card-header">
      <h2 className="card-title">⚙️ Konto Verwaltung</h2>
      <p className="card-subtitle">Session und Konto-Aktionen</p>
    </div>
    <div className="settings-section">
      <h3 className="section-title">Session Verwaltung</h3>
      <p className="section-description">
        Aktualisieren Sie Ihre Session oder melden Sie sich ab
      </p>
      <div className="action-buttons">
        <Button
          onClick={() => window.location.reload()}
          variant="outline"
        >
          🔄 Session aktualisieren
        </Button>
        <Button
          onClick={handleLogout}
          variant="secondary"
        >
          👋 Abmelden
        </Button>
      </div>
    </div>
    {/* Weitere Account-Aktionen können hier ergänzt werden */}
  </div>
);

export default AccountSettingsSection;
