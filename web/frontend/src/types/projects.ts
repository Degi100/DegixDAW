// ============================================
// PROJECTS TYPES
// TypeScript interfaces for DegixDAW projects
// ============================================

// ============================================
// Core Project Types
// ============================================

export type ProjectStatus = 'draft' | 'in_progress' | 'mixing' | 'mastered' | 'published' | 'archived';

export interface Project {
  id: string;
  creator_id: string;
  title: string;
  description?: string | null;
  bpm: number;
  time_signature: string;
  key?: string | null;
  status: ProjectStatus;
  version: number;
  is_public: boolean;
  cover_image_url?: string | null;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any>;
}

// Project with creator profile
export interface ProjectWithCreator extends Project {
  creator: {
    id: string;
    username: string;
    avatar_url?: string | null;
  };
}

// ============================================
// Project Collaborators
// ============================================

export type CollaboratorRole = 'viewer' | 'contributor' | 'mixer' | 'admin';
export type InviteMethod = 'username' | 'link' | 'chat';

export interface ProjectCollaborator {
  id: string;
  project_id: string;
  user_id: string;
  role: CollaboratorRole;
  can_edit: boolean;
  can_download: boolean;
  can_upload_audio: boolean;
  can_upload_mixdown: boolean;
  can_comment: boolean;
  can_invite_others: boolean;
  invited_by?: string | null;
  invite_method?: InviteMethod | null;
  invited_at: string;
  accepted_at?: string | null;
  created_at: string;
  // Joined from profiles (for UI display)
  username?: string | null;
  email?: string | null;
  avatar_url?: string | null;
}

// Collaborator with user profile
export interface ProjectCollaboratorWithProfile extends ProjectCollaborator {
  user: {
    id: string;
    username: string;
    avatar_url?: string | null;
    full_name?: string | null;
  };
}

// ============================================
// Project Invites
// ============================================

export interface ProjectInvite {
  id: string;
  project_id: string;
  invite_code: string;
  created_by: string;
  expires_at?: string | null;
  max_uses?: number | null;
  used_count: number;
  created_at: string;
}

// Invite with project and creator info
export interface ProjectInviteWithDetails extends ProjectInvite {
  project: {
    id: string;
    title: string;
    cover_image_url?: string | null;
  };
  creator: {
    id: string;
    username: string;
    avatar_url?: string | null;
  };
}

// ============================================
// Tracks
// ============================================

export type TrackType = 'midi' | 'audio' | 'bus' | 'fx' | 'master';

export interface Track {
  id: string;
  project_id: string;
  name: string;
  track_number: number;
  track_type: TrackType;
  color?: string | null;
  file_path?: string | null;
  file_url?: string | null;
  file_size?: number | null;
  duration_ms?: number | null;
  midi_data?: Record<string, any> | null;
  waveform_data?: WaveformData | null;
  sample_rate?: number | null;
  bit_depth?: number | null;
  channels: number;
  volume_db: number;
  pan: number;
  muted: boolean;
  soloed: boolean;
  effects?: any[];
  created_at: string;
  updated_at: string;
  created_by?: string | null;
}

// Waveform data structure
export interface WaveformData {
  peaks: number[];
  samples: number;
  channels: number;
}

// Track with creator profile
export interface TrackWithCreator extends Track {
  creator?: {
    id: string;
    username: string;
    avatar_url?: string | null;
  };
}

// ============================================
// Track Versions
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

// Track version with creator
export interface TrackVersionWithCreator extends TrackVersion {
  creator: {
    id: string;
    username: string;
    avatar_url?: string | null;
  };
}

// ============================================
// Track Comments
// ============================================

export interface TrackComment {
  id: string;
  track_id: string;
  author_id: string;
  content: string;
  timestamp_ms?: number | null;
  parent_comment_id?: string | null;
  reactions?: Record<string, number>;
  is_resolved: boolean;
  created_at: string;
  updated_at: string;
}

// Comment with author and replies
export interface TrackCommentWithDetails extends TrackComment {
  author: {
    id: string;
    username: string;
    avatar_url?: string | null;
  };
  replies?: TrackCommentWithDetails[];
}

// ============================================
// Form Types (for creating/editing)
// ============================================

export interface CreateProjectRequest {
  title: string;
  description?: string;
  bpm?: number;
  time_signature?: string;
  key?: string;
  is_public?: boolean;
}

export interface UpdateProjectRequest {
  title?: string;
  description?: string;
  bpm?: number;
  time_signature?: string;
  key?: string;
  status?: ProjectStatus;
  is_public?: boolean;
  cover_image_url?: string;
}

export interface InviteCollaboratorRequest {
  user_id: string;
  role?: CollaboratorRole;
  can_upload_audio?: boolean;
  can_comment?: boolean;
  can_invite_others?: boolean;
}

export interface CreateInviteLinkRequest {
  expires_at?: string;
  max_uses?: number;
}

export interface UploadTrackRequest {
  name: string;
  track_type: TrackType;
  track_number: number;
  file: File;
  color?: string;
}

export interface CreateTrackCommentRequest {
  content: string;
  timestamp_ms?: number;
  parent_comment_id?: string;
}

// ============================================
// Response Types
// ============================================

export interface ProjectsListResponse {
  projects: ProjectWithCreator[];
  total: number;
}

export interface ProjectDetailResponse {
  project: ProjectWithCreator;
  collaborators: ProjectCollaboratorWithProfile[];
  tracks: TrackWithCreator[];
  invites: ProjectInvite[];
}

// ============================================
// Filter/Query Types
// ============================================

export interface ProjectsFilter {
  status?: ProjectStatus;
  creator_id?: string;
  is_public?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}

export type ProjectsSortBy = 'created_at' | 'updated_at' | 'title';
export type SortOrder = 'asc' | 'desc';

export interface ProjectsQueryOptions {
  filter?: ProjectsFilter;
  sortBy?: ProjectsSortBy;
  order?: SortOrder;
}
