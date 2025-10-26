// ============================================
// TRACKS TYPES
// TypeScript interfaces for audio/MIDI tracks
// ============================================

import type { WaveformData } from '../lib/audio/audioMetadata';

// Re-export WaveformData for convenience
export type { WaveformData };

// ============================================
// Track Types
// ============================================

export type TrackType = 'audio' | 'midi' | 'bus' | 'fx' | 'master';

export interface Track {
  id: string;
  project_id: string;
  name: string;
  track_number: number;
  track_type: TrackType;
  file_path?: string | null;
  file_url?: string | null;
  user_file_id?: string | null; // Link to user_files table
  duration_ms?: number | null;
  sample_rate?: number | null;
  bit_depth?: number | null;
  channels?: number | null;
  file_size?: number | null;
  bpm?: number | null; // Detected BPM
  waveform_data?: WaveformData | null;
  midi_data?: Record<string, any> | null;
  muted: boolean; // DB column name
  soloed: boolean; // DB column name
  volume_db: number; // DB uses dB (-60 to +12)
  pan: number; // DB uses float (-1.0 to 1.0)
  color?: string | null;
  effects?: any[] | null;
  created_at: string;
  updated_at: string;
  created_by?: string | null;
}

// ============================================
// Track Creation/Update
// ============================================

export interface CreateTrackRequest {
  project_id: string;
  name: string;
  track_number?: number | undefined;
  track_type: TrackType;
  file_path?: string | undefined;
  user_file_id?: string | undefined; // Link to user_files table
  duration_ms?: number | undefined;
  sample_rate?: number | undefined;
  channels?: number | undefined;
  file_size?: number | undefined;
  bpm?: number | undefined;
  waveform_data?: WaveformData | undefined;
  color?: string | undefined;
  metadata?: Record<string, any> | undefined;
}

export interface UpdateTrackRequest {
  name?: string | undefined;
  track_number?: number | undefined;
  file_path?: string | null | undefined;
  file_url?: string | null | undefined;
  user_file_id?: string | null | undefined; // Link to user_files table
  duration_ms?: number | null | undefined;
  sample_rate?: number | null | undefined;
  bit_depth?: number | null | undefined;
  channels?: number | null | undefined;
  file_size?: number | null | undefined;
  waveform_data?: WaveformData | null | undefined;
  muted?: boolean | undefined;
  soloed?: boolean | undefined;
  volume_db?: number | undefined;
  pan?: number | undefined;
  color?: string | null | undefined;
  effects?: any[] | null | undefined;
}

// ============================================
// Track Upload
// ============================================

export interface TrackUploadOptions {
  file: File;
  project_id: string;
  track_name?: string | undefined;
  track_number?: number | undefined;
  color?: string | undefined;
  onProgress?: ((progress: number) => void) | undefined;
}

export interface TrackUploadResult {
  track: Track;
  signedUrl?: string | undefined;
}

// ============================================
// Track Comments
// ============================================

export interface TrackComment {
  id: string;
  track_id: string;
  author_id: string; // DB column name (references auth.users)
  timestamp_ms: number;
  content: string;
  is_resolved: boolean;
  created_at: string;
  updated_at: string;
  // Populated fields (joined from profiles table)
  username?: string | null;
  avatar_url?: string | null;
}

export interface CreateTrackCommentRequest {
  track_id: string;
  timestamp_ms: number;
  content: string;
}

export interface UpdateTrackCommentRequest {
  content?: string | undefined;
  is_resolved?: boolean | undefined;
}

// ============================================
// Track Versions (GitHub-style)
// ============================================

export interface TrackVersion {
  id: string;
  track_id: string;
  version_number: number;
  file_path: string;
  file_size?: number | null;
  created_by: string;
  commit_message?: string | null;
  created_at: string;
  is_current: boolean;
}

export interface CreateTrackVersionRequest {
  track_id: string;
  file_path: string;
  file_size?: number;
  commit_message?: string;
}
