// ============================================
// STORAGE CONFIGURATION
// ============================================

/**
 * Maximum file size for chat attachments
 * WICHTIG: Muss mit dem Supabase Bucket Limit übereinstimmen!
 * Siehe: scripts/sql/create_storage_bucket.sql
 */
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB in bytes

/**
 * Maximum file size in MB (for display)
 */
export const MAX_FILE_SIZE_MB = 5;

/**
 * Allowed MIME types for chat attachments
 */
export const ALLOWED_MIME_TYPES = [
  // Images
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  // Videos
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/x-msvideo',
  // Audio
  'audio/mpeg',
  'audio/wav',
  'audio/ogg',
  'audio/webm',
  'audio/midi',
  'audio/x-midi',
  // Documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv',
] as const;

/**
 * File accept string for HTML file input
 */
export const FILE_ACCEPT_STRING = 'audio/*,video/*,image/*,.mid,.midi,.pdf,.doc,.docx,.txt,.csv,.xls,.xlsx';

/**
 * Storage bucket name
 */
export const STORAGE_BUCKET = 'chat-attachments';
