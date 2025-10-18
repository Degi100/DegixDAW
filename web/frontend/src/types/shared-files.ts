// ============================================
// SHARED FILES TYPES
// Auto-generated from Supabase shared_files table
// ============================================

export type SharedFileStatus = 'unread' | 'read' | 'downloaded' | 'imported';

export interface SharedFile {
  id: string;

  // File Information
  file_name: string;
  file_size: number; // bytes
  file_type: string; // MIME type: 'audio/wav', 'audio/midi', 'image/png', etc.
  storage_path: string; // Supabase Storage path: 'shared_files/{sender_id}/{filename}'

  // Audio Metadata (optional, auto-detected)
  bpm?: number | null;
  key?: string | null; // e.g. 'C Minor', 'E Major'
  duration_seconds?: number | null;
  waveform_data?: WaveformData | null;

  // Sharing Information
  sender_id: string;
  recipient_id: string;
  message?: string | null; // Optional message from sender

  // Status Tracking
  status: SharedFileStatus;
  read_at?: string | null; // ISO timestamp
  downloaded_at?: string | null; // ISO timestamp
  imported_at?: string | null; // ISO timestamp

  // Timestamps
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

// Waveform data for audio visualization
export interface WaveformData {
  peaks: number[]; // Array of peak values (0.0 - 1.0)
  samples: number; // Total number of samples
  channels: number; // Number of audio channels (1 = mono, 2 = stereo)
}

// Extended SharedFile with sender/recipient profiles
export interface SharedFileWithProfiles extends SharedFile {
  sender: {
    id: string;
    username: string;
    avatar_url?: string | null;
  };
  recipient: {
    id: string;
    username: string;
    avatar_url?: string | null;
  };
}

// Sender statistics (from get_sender_statistics function)
export interface SenderStatistics {
  sender_id: string;
  sender_username: string;
  sender_avatar: string | null;
  file_count: number;
  unread_count: number;
  total_size: number; // bytes
  latest_file_date: string; // ISO timestamp
}

// File upload payload
export interface SharedFileUpload {
  file_name: string;
  file_size: number;
  file_type: string;
  storage_path: string;
  recipient_id: string;
  message?: string;
  bpm?: number;
  key?: string;
  duration_seconds?: number;
  waveform_data?: WaveformData;
}

// File status update payload
export interface SharedFileStatusUpdate {
  status: SharedFileStatus;
}

// Helper type for FileBrowser
export interface SharedFileItem {
  id: string;
  name: string;
  size: number;
  type: string;
  createdAt: string;

  // Sender info
  senderId: string;
  senderName: string;
  senderAvatar?: string | null | undefined;

  // Metadata
  message?: string | null | undefined;
  bpm?: number | null | undefined;
  key?: string | null | undefined;
  durationSeconds?: number | null | undefined;

  // Status
  status: SharedFileStatus;

  // URLs
  storagePath: string;
  signedUrl?: string | null | undefined;
}

// Filter options for FileBrowser
export type FileTypeFilter = 'all' | 'images' | 'videos' | 'audio' | 'documents';
export type FileStatusFilter = 'all' | 'unread' | 'read' | 'downloaded' | 'imported';

// Tab selection
export type FileBrowserTab = 'chat' | 'received' | 'sent';
