// ============================================
// VERSION HISTORY COMPONENT
// Git-style version history display
// ============================================

import { useState } from 'react';
import type { ProjectVersionWithCreator } from '../../types/projects';
import { formatDistanceToNow } from 'date-fns';

interface VersionHistoryProps {
  versions: ProjectVersionWithCreator[];
  onRestore?: (versionId: string) => void;
  onDelete?: (versionId: string) => void;
  restoring?: boolean;
}

export default function VersionHistory({
  versions,
  onRestore,
  onDelete,
  restoring = false,
}: VersionHistoryProps) {
  const [expandedVersion, setExpandedVersion] = useState<string | null>(null);

  const toggleExpand = (versionId: string) => {
    setExpandedVersion(prev => prev === versionId ? null : versionId);
  };

  if (versions.length === 0) {
    return (
      <div className="version-history-empty">
        <div className="empty-icon">📦</div>
        <p>No versions yet</p>
        <small>Create a version to save a snapshot of your project</small>
      </div>
    );
  }

  return (
    <div className="version-history">
      <div className="version-timeline">
        {versions.map((version, index) => {
          const isExpanded = expandedVersion === version.id;
          const isLatest = index === 0;
          const snapshot = version.snapshot_data;

          return (
            <div
              key={version.id}
              className={`version-item ${isLatest ? 'version-item--latest' : ''}`}
            >
              {/* Timeline dot */}
              <div className="version-dot">
                {isLatest && <span className="latest-badge">Latest</span>}
              </div>

              {/* Version Content */}
              <div className="version-content">
                <div className="version-header">
                  <div className="version-info">
                    <div className="version-title">
                      <span className="version-number">v{version.version_number}</span>
                      {version.version_tag && (
                        <span className="version-tag">{version.version_tag}</span>
                      )}
                    </div>
                    <div className="version-meta">
                      <img
                        src={version.creator.avatar_url || `https://ui-avatars.com/api/?name=${version.creator.username}`}
                        alt={version.creator.username}
                        className="version-avatar"
                      />
                      <span className="version-author">{version.creator.username}</span>
                      <span className="version-time">
                        {formatDistanceToNow(new Date(version.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  </div>

                  <div className="version-actions">
                    <button
                      onClick={() => toggleExpand(version.id)}
                      className="btn-icon"
                      title={isExpanded ? 'Collapse' : 'Expand'}
                    >
                      {isExpanded ? '▼' : '▶'}
                    </button>
                    {onRestore && !isLatest && (
                      <button
                        onClick={() => onRestore(version.id)}
                        className="btn-restore"
                        disabled={restoring}
                        title="Restore this version"
                      >
                        ↺ Restore
                      </button>
                    )}
                    {onDelete && !isLatest && versions.length > 1 && (
                      <button
                        onClick={() => onDelete(version.id)}
                        className="btn-delete"
                        title="Delete this version"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </div>

                {/* Changelog */}
                {version.changes && (
                  <div className="version-changelog">
                    {version.changes}
                  </div>
                )}

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="version-details">
                    <div className="version-stats">
                      <div className="stat-item">
                        <span className="stat-label">Tracks:</span>
                        <span className="stat-value">{snapshot.tracks?.length || 0}</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">BPM:</span>
                        <span className="stat-value">{snapshot.settings.bpm}</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">Time Signature:</span>
                        <span className="stat-value">{snapshot.settings.time_signature}</span>
                      </div>
                      {snapshot.settings.key && (
                        <div className="stat-item">
                          <span className="stat-label">Key:</span>
                          <span className="stat-value">{snapshot.settings.key}</span>
                        </div>
                      )}
                    </div>

                    {/* Track List */}
                    {snapshot.tracks && snapshot.tracks.length > 0 && (
                      <div className="version-tracks">
                        <h4>Tracks in this version:</h4>
                        <ul>
                          {snapshot.tracks.map((track, idx) => (
                            <li key={idx} className="track-item">
                              <span className="track-number">{track.track_number}</span>
                              <span className="track-name">{track.name}</span>
                              <span className="track-type">{track.track_type}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
