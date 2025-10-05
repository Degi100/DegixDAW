// src/pages/admin/components/versions/VersionList.tsx
// Version List Component - Clean Display of All Versions

import type { VersionInfo } from '../../../../lib/version';

interface VersionListProps {
  versions: VersionInfo[];
  onEdit: (version: VersionInfo) => void;
  onDelete: (version: VersionInfo) => void;
}

export default function VersionList({ versions, onEdit, onDelete }: VersionListProps) {
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'major': return 'danger';
      case 'minor': return 'success';
      case 'patch': return 'primary';
      default: return 'secondary';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'major': return '🏗️';
      case 'minor': return '✨';
      case 'patch': return '🔧';
      default: return '📦';
    }
  };

  return (
    <div className="version-list">
      {versions.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📦</div>
          <h3>Keine Versionen gefunden</h3>
          <p>Beginnen Sie mit dem Hinzufügen Ihrer ersten Version.</p>
        </div>
      ) : (
        <div className="version-grid">
          {versions.map((version, index) => (
            <div
              key={version.version}
              className={`version-item ${index === 0 ? 'version-item--latest' : ''}`}
            >
              <div className="version-item-header">
                <div className="version-info">
                  <span className="version-number">v{version.version}</span>
                  <span className={`version-type version-type--${getTypeColor(version.type)}`}>
                    {getTypeIcon(version.type)} {version.type}
                  </span>
                </div>

                <div className="version-date">
                  {new Date(version.date).toLocaleDateString('de-DE')}
                </div>
              </div>

              <div className="version-changes">
                {version.changes.added && version.changes.added.length > 0 && (
                  <div className="change-section">
                    <h4 className="change-title change-title--added">✨ Hinzugefügt</h4>
                    <ul className="change-list">
                      {version.changes.added.map((change, idx) => (
                        <li key={idx}>{change}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {version.changes.fixed && version.changes.fixed.length > 0 && (
                  <div className="change-section">
                    <h4 className="change-title change-title--fixed">🔧 Behoben</h4>
                    <ul className="change-list">
                      {version.changes.fixed.map((change, idx) => (
                        <li key={idx}>{change}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {version.changes.changed && version.changes.changed.length > 0 && (
                  <div className="change-section">
                    <h4 className="change-title change-title--changed">📝 Geändert</h4>
                    <ul className="change-list">
                      {version.changes.changed.map((change, idx) => (
                        <li key={idx}>{change}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="version-actions">
                <button
                  onClick={() => onEdit(version)}
                  className="btn btn-outline btn-sm"
                >
                  ✏️ Bearbeiten
                </button>
                <button
                  onClick={() => onDelete(version)}
                  className="btn btn-danger btn-sm"
                  disabled={index === 0} // Aktuelle Version nicht löschbar
                >
                  🗑️ Löschen
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
