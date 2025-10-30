// ============================================
// TRACK STORAGE SERVICE
// Upload/download audio files to/from Supabase Storage
// ============================================

import { supabase } from '../../supabase';

const TRACKS_BUCKET = 'project-tracks';
const SHARED_FILES_BUCKET = 'shared_files';

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface UploadResult {
  path: string;
  publicUrl?: string | undefined;
  signedUrl?: string | undefined;
}

// ============================================
// Upload User File to Shared Storage
// New flow: Files go to shared_files/{user_id}/ for multi-project usage
// ============================================

export async function uploadUserFile(
  userId: string,
  file: File,
  _onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
  try {
    // Generate file path: {user_id}/{filename}
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const sanitizedName = file.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
    const filePath = `${userId}/${sanitizedName}_${timestamp}.${fileExtension}`;

    // Upload file to shared_files bucket
    const { data, error } = await supabase.storage
      .from(SHARED_FILES_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false, // Don't overwrite (each upload is unique with timestamp)
      });

    if (error) {
      console.error('Upload error:', error);
      throw error;
    }

    // Get signed URL (expires in 1 hour)
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from(SHARED_FILES_BUCKET)
      .createSignedUrl(filePath, 3600);

    if (signedUrlError) {
      console.error('Signed URL error:', signedUrlError);
    }

    return {
      path: data.path,
      signedUrl: signedUrlData?.signedUrl,
    };
  } catch (error) {
    console.error('uploadUserFile failed:', error);
    throw error;
  }
}

// ============================================
// Upload Track File (LEGACY - for backward compatibility)
// ============================================

export async function uploadTrackFile(
  projectId: string,
  trackId: string,
  file: File,
  _onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
  try {
    // Generate file path: projects/{projectId}/tracks/{trackId}/{filename}
    const fileExtension = file.name.split('.').pop();
    const filePath = `projects/${projectId}/tracks/${trackId}.${fileExtension}`;

    // Upload file
    const { data, error } = await supabase.storage
      .from(TRACKS_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true, // Overwrite if exists (for track updates)
      });

    if (error) {
      console.error('Upload error:', error);
      throw error;
    }

    // Get signed URL (expires in 1 hour)
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from(TRACKS_BUCKET)
      .createSignedUrl(filePath, 3600);

    if (signedUrlError) {
      console.error('Signed URL error:', signedUrlError);
    }

    return {
      path: data.path,
      signedUrl: signedUrlData?.signedUrl,
    };
  } catch (error) {
    console.error('uploadTrackFile failed:', error);
    throw error;
  }
}

// ============================================
// Get Signed URL for Track
// ============================================

export async function getTrackSignedUrl(
  filePath: string,
  expiresIn: number = 3600
): Promise<string | null> {
  try {
    const { data, error } = await supabase.storage
      .from(TRACKS_BUCKET)
      .createSignedUrl(filePath, expiresIn);

    if (error) {
      console.error('Error getting signed URL:', error);
      throw error;
    }

    return data.signedUrl;
  } catch (error) {
    console.error('getTrackSignedUrl failed:', error);
    return null;
  }
}

// ============================================
// Delete Track File
// ============================================

export async function deleteTrackFile(filePath: string): Promise<boolean> {
  try {
    const { error } = await supabase.storage
      .from(TRACKS_BUCKET)
      .remove([filePath]);

    if (error) {
      console.error('Delete error:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('deleteTrackFile failed:', error);
    return false;
  }
}

// ============================================
// Download Track File
// ============================================

export async function downloadTrackFile(filePath: string): Promise<Blob | null> {
  try {
    const { data, error } = await supabase.storage
      .from(TRACKS_BUCKET)
      .download(filePath);

    if (error) {
      console.error('Download error:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('downloadTrackFile failed:', error);
    return null;
  }
}

// ============================================
// List Track Files in Project
// ============================================

export async function listProjectTracks(projectId: string): Promise<string[]> {
  try {
    const { data, error } = await supabase.storage
      .from(TRACKS_BUCKET)
      .list(`projects/${projectId}/tracks`);

    if (error) {
      console.error('List error:', error);
      throw error;
    }

    return data.map((file) => file.name);
  } catch (error) {
    console.error('listProjectTracks failed:', error);
    return [];
  }
}

// ============================================
// Trigger Browser Download for Track
// ============================================

export async function triggerTrackDownload(
  filePath: string,
  fileName: string
): Promise<void> {
  try {
    // Get signed URL for download
    const signedUrl = await getTrackSignedUrl(filePath, 3600);

    if (!signedUrl) {
      throw new Error('Failed to get download URL');
    }

    // Trigger browser download
    const a = document.createElement('a');
    a.href = signedUrl;
    a.download = fileName;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } catch (error) {
    console.error('triggerTrackDownload failed:', error);
    throw error;
  }
}

// ============================================
// Check if Storage Bucket Exists
// ============================================

export async function ensureTracksBucketExists(): Promise<boolean> {
  try {
    const { data: buckets, error } = await supabase.storage.listBuckets();

    if (error) {
      console.error('Error listing buckets:', error);
      return false;
    }

    const bucketExists = buckets.some((bucket) => bucket.name === TRACKS_BUCKET);

    if (!bucketExists) {
      console.warn(`⚠️ Bucket '${TRACKS_BUCKET}' does not exist!`);
      console.warn('Create it in Supabase Dashboard: Storage → New Bucket');
      console.warn('Settings: Public = false, File size limit = 500 MB');
      return false;
    }

    return true;
  } catch (error) {
    console.error('ensureTracksBucketExists failed:', error);
    return false;
  }
}
