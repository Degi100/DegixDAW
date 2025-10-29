// ============================================
// TRACK VERSION UTILITIES
// Helper functions to find track version info from snapshots
// ============================================

import type { ProjectVersionWithCreator } from '../../../types/projects';
import type { Track } from '../../../types/tracks';

/**
 * Find the version where a track was first added
 */
export function findTrackAddedInVersion(
  trackId: string,
  versions: ProjectVersionWithCreator[]
): ProjectVersionWithCreator | null {
  if (versions.length === 0) return null;

  // Sort versions by version_number ascending (oldest first)
  const sortedVersions = [...versions].sort((a, b) => a.version_number - b.version_number);

  // Find first version that contains this track
  for (const version of sortedVersions) {
    const snapshot = version.snapshot_data;
    if (snapshot?.tracks) {
      const hasTrack = snapshot.tracks.some((t: any) => t.id === trackId);
      if (hasTrack) {
        return version;
      }
    }
  }

  return null;
}

/**
 * Find the last version where a track was modified
 */
export function findTrackLastModifiedVersion(
  trackId: string,
  versions: ProjectVersionWithCreator[]
): ProjectVersionWithCreator | null {
  if (versions.length === 0) return null;

  // Sort versions by version_number descending (newest first)
  const sortedVersions = [...versions].sort((a, b) => b.version_number - a.version_number);

  let previousTrack: any = null;

  for (const version of sortedVersions) {
    const snapshot = version.snapshot_data;
    if (snapshot?.tracks) {
      const track = snapshot.tracks.find((t: any) => t.id === trackId);

      if (track) {
        // First version we encounter (newest)
        if (!previousTrack) {
          previousTrack = track;
          continue;
        }

        // Compare with previous version
        if (hasTrackChanged(previousTrack, track)) {
          return version; // This is the version where changes were made
        }

        previousTrack = track;
      }
    }
  }

  return null;
}

/**
 * Check if track has changed between two snapshots
 */
function hasTrackChanged(track1: any, track2: any): boolean {
  // Compare important fields that indicate changes
  return (
    track1.name !== track2.name ||
    track1.volume_db !== track2.volume_db ||
    track1.pan !== track2.pan ||
    track1.muted !== track2.muted ||
    track1.soloed !== track2.soloed ||
    track1.file_url !== track2.file_url ||
    JSON.stringify(track1.effects) !== JSON.stringify(track2.effects)
  );
}

/**
 * Get track version info (added in version + last modified)
 */
export interface TrackVersionInfo {
  trackId: string;
  addedInVersion: {
    versionNumber: number;
    versionTag?: string | null;
    changes?: string | null;
  } | null;
  lastModifiedInVersion: {
    versionNumber: number;
    versionTag?: string | null;
    changes?: string | null;
  } | null;
}

export function getTrackVersionInfo(
  trackId: string,
  versions: ProjectVersionWithCreator[]
): TrackVersionInfo {
  const addedVersion = findTrackAddedInVersion(trackId, versions);
  const lastModifiedVersion = findTrackLastModifiedVersion(trackId, versions);

  return {
    trackId,
    addedInVersion: addedVersion ? {
      versionNumber: addedVersion.version_number,
      versionTag: addedVersion.version_tag ?? null,
      changes: addedVersion.changes ?? null,
    } : null,
    lastModifiedInVersion: lastModifiedVersion ? {
      versionNumber: lastModifiedVersion.version_number,
      versionTag: lastModifiedVersion.version_tag ?? null,
      changes: lastModifiedVersion.changes ?? null,
    } : null,
  };
}

/**
 * Get version info for all tracks
 */
export function getAllTracksVersionInfo(
  tracks: Track[],
  versions: ProjectVersionWithCreator[]
): Map<string, TrackVersionInfo> {
  const result = new Map<string, TrackVersionInfo>();

  for (const track of tracks) {
    result.set(track.id, getTrackVersionInfo(track.id, versions));
  }

  return result;
}
