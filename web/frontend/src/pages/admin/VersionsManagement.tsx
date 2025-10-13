// src/pages/admin/VersionsManagement.tsx
// Versions Management Page - Clean and Focused Implementation

import { useState } from 'react';
import AdminLayoutCorporate from '../../components/admin/AdminLayoutCorporate';
import { VERSION_HISTORY, type VersionInfo } from '../../lib/version';
import { useToast } from '../../hooks/useToast';
import VersionList from './components/versions/VersionList';
import VersionFormModal from './components/versions/VersionFormModal';

export default function VersionsManagement() {
  const [versions, setVersions] = useState<VersionInfo[]>(VERSION_HISTORY);
  const [selectedVersion, setSelectedVersion] = useState<VersionInfo | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const { success, error } = useToast();

  const handleAddVersion = () => {
    setSelectedVersion(null);
    setIsEditing(false);
    setShowFormModal(true);
  };

  const handleEditVersion = (version: VersionInfo) => {
    setSelectedVersion(version);
    setIsEditing(true);
    setShowFormModal(true);
  };

  const handleDeleteVersion = (version: VersionInfo) => {
    if (window.confirm(`Möchten Sie die Version ${version.version} wirklich löschen?`)) {
      try {
        // In einer echten Anwendung würde das hier die Datenbank aktualisieren
        const updatedVersions = versions.filter(v => v.version !== version.version);
        setVersions([...updatedVersions]);
        success(`Version ${version.version} erfolgreich gelöscht`);
      } catch {
        error('Fehler beim Löschen der Version');
      }
    }
  };

  const handleSaveVersion = (versionData: Omit<VersionInfo, 'version'> & { version?: string }) => {
    try {
      if (isEditing && selectedVersion) {
        // Bearbeiten bestehender Version
        const updatedVersions = versions.map((v: VersionInfo) =>
          v.version === selectedVersion.version
            ? { ...v, ...versionData, version: selectedVersion.version }
            : v
        );
        setVersions(updatedVersions);
        success(`Version ${selectedVersion.version} erfolgreich aktualisiert`);
      } else {
        // Neue Version hinzufügen
        const newVersion: VersionInfo = {
          version: versionData.version || `0.1.${Date.now()}`,
          date: new Date().toISOString().split('T')[0],
          type: versionData.type,
          changes: versionData.changes
        };

        setVersions((prev: VersionInfo[]) => [newVersion, ...prev]);
        success(`Version ${newVersion.version} erfolgreich hinzugefügt`);
      }

      setShowFormModal(false);
      setSelectedVersion(null);
    } catch {
      error('Fehler beim Speichern der Version');
    }
  };

  return (
    <AdminLayoutCorporate>
      <div className="admin-page">
        <div className="admin-page-header">
          <div className="admin-page-title">
            <h1>📦 Versionsmanagement</h1>
            <p>Versionshistorie verwalten und neue Versionen hinzufügen</p>
          </div>

          <div className="admin-page-actions">
            <button
              onClick={handleAddVersion}
              className="btn btn-primary"
            >
              ➕ Version hinzufügen
            </button>
          </div>
        </div>

        <div className="admin-page-content">
          <VersionList
            versions={versions}
            onEdit={handleEditVersion}
            onDelete={handleDeleteVersion}
          />
        </div>

        {showFormModal && (
          <VersionFormModal
            version={selectedVersion}
            isEditing={isEditing}
            onSave={handleSaveVersion}
            onClose={() => {
              setShowFormModal(false);
              setSelectedVersion(null);
            }}
          />
        )}
      </div>
    </AdminLayoutCorporate>
  );
}
