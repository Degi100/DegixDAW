// ============================================
// TRACKS SERVICE
// API layer for track CRUD operations + uploads
// ============================================

import { supabase } from '../../supabase';
import { uploadTrackFile } from '../storage/trackStorage';
import { extractAudioMetadata, generateWaveform } from '../../audio/audioMetadata';
import type {
  Track,
  CreateTrackRequest,
  UpdateTrackRequest,
  TrackUploadOptions,
  TrackUploadResult,
} from '../../../types/tracks';

// ============================================
// Get Tracks for Project
// ============================================

export async function getProjectTracks(projectId: string): Promise<Track[]> {
  try {
    const { data, error } = await supabase
      .from('tracks')
      .select('*')
      .eq('project_id', projectId)
      .order('track_number', { ascending: true });

    if (error) {
      console.error('Error fetching tracks:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('getProjectTracks failed:', error);
    return [];
  }
}

// ============================================
// Get Single Track
// ============================================

export async function getTrack(trackId: string): Promise<Track | null> {
  try {
    const { data, error } = await supabase
      .from('tracks')
      .select('*')
      .eq('id', trackId)
      .single();

    if (error) {
      console.error('Error fetching track:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('getTrack failed:', error);
    return null;
  }
}

// ============================================
// Create Track (without file upload)
// ============================================

export async function createTrack(data: CreateTrackRequest): Promise<Track | null> {
  try {
    // Get next track number if not provided
    let trackNumber = data.track_number;

    if (!trackNumber) {
      const existingTracks = await getProjectTracks(data.project_id);
      trackNumber = existingTracks.length + 1;
    }

    // Get current user for created_by
    const { data: { user } } = await supabase.auth.getUser();

    const trackData = {
      project_id: data.project_id,
      name: data.name,
      track_number: trackNumber,
      track_type: data.track_type,
      file_path: data.file_path || null,
      duration_ms: data.duration_ms || null,
      sample_rate: data.sample_rate || null,
      channels: data.channels || null,
      file_size: data.file_size || null,
      waveform_data: data.waveform_data || null,
      color: data.color || null,
      muted: false, // DB column is 'muted', not 'is_muted'
      soloed: false, // DB column is 'soloed', not 'is_soloed'
      volume_db: 0.0, // DB uses volume_db (float), not volume (0-100)
      pan: 0.0, // DB uses float -1 to 1, not -100 to 100
      created_by: user?.id || null,
    };

    const { data: track, error } = await supabase
      .from('tracks')
      .insert(trackData)
      .select()
      .single();

    if (error) {
      console.error('Error creating track:', error);
      throw error;
    }

    return track;
  } catch (error) {
    console.error('createTrack failed:', error);
    return null;
  }
}

// ============================================
// Upload Audio Track (Full Flow)
// ============================================

export async function uploadAudioTrack(
  options: TrackUploadOptions
): Promise<TrackUploadResult | null> {
  const { file, project_id, track_name, track_number, color, onProgress } = options;

  try {
    // Step 1: Extract metadata
    const metadata = await extractAudioMetadata(file);

    // Step 2: Generate waveform
    const waveform = await generateWaveform(file, 1000);

    // Step 3: Create track record in DB (without file_path yet)
    const track = await createTrack({
      project_id,
      name: track_name || file.name.replace(/\.[^/.]+$/, ''), // Remove extension
      track_number,
      track_type: 'audio',
      duration_ms: Math.round(metadata.duration * 1000),
      sample_rate: metadata.sampleRate,
      channels: metadata.numberOfChannels,
      file_size: metadata.fileSize,
      waveform_data: waveform,
      color,
      metadata: {
        originalFileName: metadata.fileName,
        format: metadata.format,
      },
    });

    if (!track) {
      throw new Error('Failed to create track record');
    }

    // Step 4: Upload file to Supabase Storage
    const uploadResult = await uploadTrackFile(
      project_id,
      track.id,
      file,
      (progress) => {
        if (onProgress) {
          onProgress(progress.percentage);
        }
      }
    );

    // Step 5: Update track with file_path
    const updatedTrack = await updateTrack(track.id, {
      file_path: uploadResult.path,
    });

    if (!updatedTrack) {
      throw new Error('Failed to update track with file path');
    }

    return {
      track: updatedTrack,
      signedUrl: uploadResult.signedUrl,
    };
  } catch (error) {
    console.error('uploadAudioTrack failed:', error);
    throw error;
  }
}

// ============================================
// Update Track
// ============================================

export async function updateTrack(
  trackId: string,
  updates: UpdateTrackRequest
): Promise<Track | null> {
  try {
    const { data, error } = await supabase
      .from('tracks')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', trackId)
      .select()
      .single();

    if (error) {
      console.error('Error updating track:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('updateTrack failed:', error);
    return null;
  }
}

// ============================================
// Delete Track
// ============================================

export async function deleteTrack(trackId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('tracks')
      .delete()
      .eq('id', trackId);

    if (error) {
      console.error('Error deleting track:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('deleteTrack failed:', error);
    return false;
  }
}

// ============================================
// Reorder Tracks
// ============================================

export async function reorderTracks(
  projectId: string,
  trackIds: string[]
): Promise<boolean> {
  try {
    // Update track_number for each track
    const updates = trackIds.map((trackId, index) =>
      supabase
        .from('tracks')
        .update({ track_number: index + 1 })
        .eq('id', trackId)
    );

    await Promise.all(updates);

    return true;
  } catch (error) {
    console.error('reorderTracks failed:', error);
    return false;
  }
}

// ============================================
// Subscribe to Track Updates (Realtime)
// ============================================

export function subscribeToProjectTracks(
  projectId: string,
  callback: (tracks: Track[]) => void
) {
  const channel = supabase
    .channel(`project-tracks:${projectId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'tracks',
        filter: `project_id=eq.${projectId}`,
      },
      async () => {
        // Refetch all tracks when any change occurs
        const tracks = await getProjectTracks(projectId);
        callback(tracks);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
