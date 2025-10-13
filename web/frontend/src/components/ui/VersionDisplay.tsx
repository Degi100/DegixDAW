// src/components/ui/VersionDisplay.tsx
import { VERSION_HISTORY, formatVersionForDisplay } from '../../lib/version';
import type { VersionInfo } from '../../lib/version';

interface VersionDisplayProps {
  currentVersion?: string;
  maxVersions?: number;
  showCurrentVersion?: boolean;
}

export default function VersionDisplay({
  currentVersion,
  maxVersions = 5,
  showCurrentVersion = true
}: VersionDisplayProps) {
  const versions = VERSION_HISTORY.slice(0, maxVersions);
  const displayVersion = currentVersion || VERSION_HISTORY[0]?.version || '0.1.0';

  return (
    <div className="version-display">
      <div className="version-display__header">
        <h3 className="version-display__title">🆕 Versionshistorie</h3>
        {showCurrentVersion && (
          <div className="version-display__current">
            <span className="version-display__current-label">Aktuelle Version:</span>
            <span className="version-display__current-version">
              {formatVersionForDisplay(displayVersion)}
            </span>
          </div>
        )}
      </div>

      <div className="version-display__timeline">
        {versions.map((version, index) => (
          <VersionCard
            key={version.version}
            version={version}
            isLatest={index === 0}
          />
        ))}
      </div>
    </div>
  );
}

interface VersionCardProps {
  version: VersionInfo;
  isLatest: boolean;
}

function VersionCard({ version, isLatest }: VersionCardProps) {
  return (
    <div className={`version-card ${isLatest ? 'version-card--latest' : ''}`}>
      <div className="version-card__header">
        <span className={`version-card__version ${isLatest ? 'version-card__version--bold' : ''}`}>
          v{version.version}
        </span>
        <span className="version-card__date">
          {new Date(version.date).toLocaleDateString('de-DE')}
        </span>
        <span className={`version-card__type version-card__type--${version.type}`}>
          {version.type === 'major' && '🏗️ Major'}
          {version.type === 'minor' && '✨ Minor'}
          {version.type === 'patch' && '🔧 Patch'}
        </span>
      </div>

      <div className="version-card__changes">
        {version.changes.added && version.changes.added.length > 0 && (
          <div className="version-card__section">
            <h4 className="version-card__section-title version-card__section-title--added">
              ✨ Hinzugefügt
            </h4>
            <ul className="version-card__list">
              {version.changes.added.map((change, idx) => (
                <li key={idx} className="version-card__item">
                  {change}
                </li>
              ))}
            </ul>
          </div>
        )}

        {version.changes.fixed && version.changes.fixed.length > 0 && (
          <div className="version-card__section">
            <h4 className="version-card__section-title version-card__section-title--fixed">
              🔧 Behoben
            </h4>
            <ul className="version-card__list">
              {version.changes.fixed.map((change, idx) => (
                <li key={idx} className="version-card__item">
                  {change}
                </li>
              ))}
            </ul>
          </div>
        )}

        {version.changes.changed && version.changes.changed.length > 0 && (
          <div className="version-card__section">
            <h4 className="version-card__section-title version-card__section-title--changed">
              📝 Geändert
            </h4>
            <ul className="version-card__list">
              {version.changes.changed.map((change, idx) => (
                <li key={idx} className="version-card__item">
                  {change}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
