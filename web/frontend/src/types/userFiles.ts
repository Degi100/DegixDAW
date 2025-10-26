// ============================================
// USER FILES TYPES
// TypeScript interfaces for user_files table
// ============================================

export type UserFileSource = 'chat' | 'upload' | 'project';

export interface UserFile {
  id: string;
  user_id: string;
  uploaded_by: string;

  // File Info
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number | null;
  duration_ms: number | null;

  // Source Tracking
  source: UserFileSource;
  source_message_id: string | null;
  source_project_ids: string[] | null;

  // Metadata
  metadata: Record<string, any> | null;

  // Timestamps
  created_at: string;
  updated_at: string;

  // Joined data (optional)
  projects?: Array<{
    id: string;
    title: string;
  }>;
  uploader?: {
    id: string;
    username: string;
    avatar_url: string | null;
  };
}

export interface CreateUserFileRequest {
  file_name: string;
  file_path: string;
  file_type: string;
  file_size?: number;
  duration_ms?: number;
  source: UserFileSource;
  source_message_id?: string;
  source_project_ids?: string[];
  metadata?: Record<string, any>;
}

export interface UpdateUserFileRequest {
  file_name?: string;
  source?: UserFileSource;
  source_project_ids?: string[];
  metadata?: Record<string, any>;
}

export interface UserFileWithUsage extends UserFile {
  used_in_projects: Array<{
    id: string;
    title: string;
  }>;
  is_in_project: boolean;
}
