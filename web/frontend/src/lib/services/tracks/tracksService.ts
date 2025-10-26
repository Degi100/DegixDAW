// ============================================
// TRACKS SERVICE
// API layer for track CRUD operations + uploads
// ============================================

import { supabase } from '../../supabase';
import { uploadUserFile } from '../storage/trackStorage';
import { extractAudioMetadata, generateWaveform } from '../../audio/audioMetadata';
import { createUserFile } from '../files/userFilesService';
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

    if (!data) return [];

    // Generate URLs for all tracks with file_path
    const tracksWithUrls = data.map((track) => {
      if (track.file_path) {
        // Use public URL (bucket is set to public)
        const { data: publicUrlData } = supabase.storage
          .from('shared_files')
          .getPublicUrl(track.file_path);

        return { ...track, file_url: publicUrlData.publicUrl };
      }
      return track;
    });

    return tracksWithUrls;
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

    if (!data) return null;

    // Generate signed URL if track has file_path
    if (data.file_path) {
      try {
        // Tracks are now stored in shared_files bucket (via user_files)
        const { data: urlData } = await supabase.storage
          .from('shared_files')
          .createSignedUrl(data.file_path, 3600); // 1 hour expiry

        return { ...data, file_url: urlData?.signedUrl || null };
      } catch (err) {
        console.warn(`Failed to get signed URL for track ${trackId}:`, err);
      }
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
      user_file_id: data.user_file_id || null, // Link to user_files table
      duration_ms: data.duration_ms || null,
      sample_rate: data.sample_rate || null,
      channels: data.channels || null,
      file_size: data.file_size || null,
      bpm: data.bpm || null, // BPM from web-audio-beat-detector
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
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Step 1: Extract metadata
    const metadata = await extractAudioMetadata(file);

    // Step 2: Generate waveform
    const waveform = await generateWaveform(file, 1000);

    // Step 3: Upload file to Supabase Storage (shared_files/{user_id}/)
    const uploadResult = await uploadUserFile(
      user.id,
      file,
      (progress) => {
        if (onProgress) {
          onProgress(progress.percentage);
        }
      }
    );

    // Step 4: Create user_files entry (central registry)
    const userFile = await createUserFile({
      uploaded_by: user.id,
      file_name: file.name,
      file_path: uploadResult.path,
      file_type: file.type,
      file_size: metadata.fileSize,
      duration_ms: Math.round(metadata.duration * 1000),
      source: 'project',
      source_project_ids: [project_id],
      metadata: {
        originalFileName: metadata.fileName,
        format: metadata.format,
        bpm: metadata.bpm,
        sampleRate: metadata.sampleRate,
        channels: metadata.numberOfChannels,
        waveform: waveform,
      },
    });

    if (!userFile) {
      throw new Error('Failed to create user_files entry');
    }

    // Step 5: Create track record in DB with user_file_id link
    const track = await createTrack({
      project_id,
      name: track_name || file.name.replace(/\.[^/.]+$/, ''), // Remove extension
      track_number,
      track_type: 'audio',
      file_path: uploadResult.path,
      user_file_id: userFile.id, // Link to user_files
      duration_ms: Math.round(metadata.duration * 1000),
      sample_rate: metadata.sampleRate,
      channels: metadata.numberOfChannels,
      file_size: metadata.fileSize,
      bpm: metadata.bpm, // BPM from detection
      waveform_data: waveform,
      color,
      metadata: {
        originalFileName: metadata.fileName,
        format: metadata.format,
        bpm: metadata.bpm, // Also store in metadata
      },
    });

    if (!track) {
      throw new Error('Failed to create track record');
    }

    return {
      track,
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
    console.log('🗑️ Deleting track:', trackId);

    // First, get the track to find user_file_id and project_id
    const { data: track, error: fetchError } = await supabase
      .from('tracks')
      .select('user_file_id, project_id')
      .eq('id', trackId)
      .single();

    if (fetchError) {
      console.error('Error fetching track for deletion:', fetchError);
      throw fetchError;
    }

    console.log('📋 Track info:', { user_file_id: track?.user_file_id, project_id: track?.project_id });

    // Delete the track
    const { error: deleteError } = await supabase
      .from('tracks')
      .delete()
      .eq('id', trackId);

    if (deleteError) {
      console.error('Error deleting track:', deleteError);
      throw deleteError;
    }

    console.log('✅ Track deleted from DB');

    // If track has user_file_id, remove project_id from source_project_ids
    if (track?.user_file_id && track?.project_id) {
      console.log('🔄 Updating user_files, removing project_id from source_project_ids...');

      // Import removeFileFromProject to handle the update
      const { removeFileFromProject } = await import('../files/userFilesService');
      await removeFileFromProject(track.user_file_id, track.project_id);

      console.log('✅ user_files updated');
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
  _projectId: string,
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
