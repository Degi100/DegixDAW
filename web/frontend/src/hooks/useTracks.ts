// ============================================
// USE TRACKS HOOK
// React hook for managing project tracks
// ============================================

import { useState, useEffect, useCallback } from 'react';
import { useToast } from './useToast';
import {
  getProjectTracks,
  uploadAudioTrack,
  updateTrack,
  deleteTrack,
  subscribeToProjectTracks,
} from '../lib/services/tracks/tracksService';
import type { Track, TrackUploadOptions } from '../types/tracks';

export function useTracks(projectId: string | null) {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const { success, error: showError } = useToast();

  // ============================================
  // Fetch Tracks
  // ============================================

  const fetchTracks = useCallback(async () => {
    if (!projectId) {
      setTracks([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await getProjectTracks(projectId);
      setTracks(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load tracks';
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [projectId, showError]);

  // ============================================
  // Upload Track
  // ============================================

  const upload = useCallback(
    async (file: File, trackName?: string, trackNumber?: number, color?: string): Promise<Track | null> => {
      if (!projectId) {
        showError('No project ID provided');
        return null;
      }

      try {
        setUploading(true);
        setUploadProgress(0);
        setError(null);

        const options: TrackUploadOptions = {
          file,
          project_id: projectId,
          track_name: trackName,
          track_number: trackNumber,
          color,
          onProgress: (progress) => {
            setUploadProgress(progress);
          },
        };

        const result = await uploadAudioTrack(options);

        if (result) {
          success(`Track "${result.track.name}" uploaded successfully! 🎵`);
          await fetchTracks(); // Refresh track list
          return result.track;
        }

        return null;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Upload failed';
        setError(errorMessage);
        showError(errorMessage);
        return null;
      } finally {
        setUploading(false);
        setUploadProgress(0);
      }
    },
    [projectId, success, showError, fetchTracks]
  );

  // ============================================
  // Update Track
  // ============================================

  const update = useCallback(
    async (trackId: string, updates: Partial<Track>): Promise<Track | null> => {
      try {
        setError(null);
        const updatedTrack = await updateTrack(trackId, updates);

        if (updatedTrack) {
          success('Track updated! ✅');
          await fetchTracks();
          return updatedTrack;
        }

        return null;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Update failed';
        setError(errorMessage);
        showError(errorMessage);
        return null;
      }
    },
    [success, showError, fetchTracks]
  );

  // ============================================
  // Delete Track
  // ============================================

  const remove = useCallback(
    async (trackId: string): Promise<boolean> => {
      try {
        setError(null);
        const deleted = await deleteTrack(trackId);

        if (deleted) {
          success('Track deleted! 🗑️');
          await fetchTracks();
          return true;
        }

        return false;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Delete failed';
        setError(errorMessage);
        showError(errorMessage);
        return false;
      }
    },
    [success, showError, fetchTracks]
  );

  // ============================================
  // Initial Load
  // ============================================

  useEffect(() => {
    fetchTracks();
  }, [fetchTracks]);

  // ============================================
  // Realtime Subscription
  // ============================================

  useEffect(() => {
    if (!projectId) return;

    const unsubscribe = subscribeToProjectTracks(projectId, (updatedTracks) => {
      setTracks(updatedTracks);
    });

    return () => {
      unsubscribe();
    };
  }, [projectId]);

  return {
    tracks,
    loading,
    uploading,
    uploadProgress,
    error,
    upload,
    update,
    remove,
    refresh: fetchTracks,
  };
}
