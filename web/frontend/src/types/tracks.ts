// ============================================
// TRACKS TYPES
// TypeScript interfaces for audio/MIDI tracks
// ============================================

import type { WaveformData } from '../lib/audio/audioMetadata';

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
  duration_ms?: number | null;
  sample_rate?: number | null;
  bit_depth?: number | null;
  channels?: number | null;
  file_size?: number | null;
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
  track_number?: number;
  track_type: TrackType;
  file_path?: string;
  duration_ms?: number;
  sample_rate?: number;
  channels?: number;
  file_size?: number;
  waveform_data?: WaveformData;
  color?: string;
  metadata?: Record<string, any>;
}

export interface UpdateTrackRequest {
  name?: string;
  track_number?: number;
  file_path?: string;
  file_url?: string;
  duration_ms?: number;
  sample_rate?: number;
  bit_depth?: number;
  channels?: number;
  file_size?: number;
  waveform_data?: WaveformData;
  muted?: boolean; // DB column name
  soloed?: boolean; // DB column name
  volume_db?: number; // DB uses dB
  pan?: number; // DB uses float
  color?: string;
  effects?: any[];
}

// ============================================
// Track Upload
// ============================================

export interface TrackUploadOptions {
  file: File;
  project_id: string;
  track_name?: string;
  track_number?: number;
  color?: string;
  onProgress?: (progress: number) => void;
}

export interface TrackUploadResult {
  track: Track;
  signedUrl?: string;
}

// ============================================
// Track Comments
// ============================================

export interface TrackComment {
  id: string;
  track_id: string;
  user_id: string;
  timestamp_ms: number;
  content: string;
  is_resolved: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateTrackCommentRequest {
  track_id: string;
  timestamp_ms: number;
  content: string;
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
