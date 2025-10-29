// ============================================
// TRACK VERSION BADGE
// Shows version info for a track (added in vX, modified in vY)
// ============================================

import type { TrackVersionInfo } from '../../lib/services/projects/trackVersionUtils';

interface TrackVersionBadgeProps {
  versionInfo: TrackVersionInfo | null;
  showModified?: boolean;
}

export default function TrackVersionBadge({
  versionInfo,
  showModified = false,
}: TrackVersionBadgeProps) {
  if (!versionInfo || !versionInfo.addedInVersion) {
    return null;
  }

  const { addedInVersion, lastModifiedInVersion } = versionInfo;

  return (
    <div className="track-version-badge">
      {/* Added in Version Badge */}
      <span
        className="version-badge version-badge--added"
        title={`Added in version ${addedInVersion.versionNumber}${addedInVersion.changes ? `: ${addedInVersion.changes}` : ''}`}
      >
        📦 v{addedInVersion.versionNumber}
        {addedInVersion.versionTag && (
          <span className="version-tag"> ({addedInVersion.versionTag})</span>
        )}
      </span>

      {/* Last Modified Badge (optional) */}
      {showModified && lastModifiedInVersion && lastModifiedInVersion.versionNumber !== addedInVersion.versionNumber && (
        <span
          className="version-badge version-badge--modified"
          title={`Modified in version ${lastModifiedInVersion.versionNumber}${lastModifiedInVersion.changes ? `: ${lastModifiedInVersion.changes}` : ''}`}
        >
          ✏️ v{lastModifiedInVersion.versionNumber}
          {lastModifiedInVersion.versionTag && (
            <span className="version-tag"> ({lastModifiedInVersion.versionTag})</span>
          )}
        </span>
      )}
    </div>
  );
}
