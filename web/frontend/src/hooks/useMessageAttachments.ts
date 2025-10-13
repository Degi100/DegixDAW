// src/hooks/useMessageAttachments.ts
// File Upload Hook for Chat Messages

import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from './useToast';
import { MAX_FILE_SIZE, MAX_FILE_SIZE_MB, STORAGE_BUCKET } from '../lib/constants/storage';

export interface UploadProgress {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error';
  error?: string;
  url?: string;
  thumbnailUrl?: string;
}

export function useMessageAttachments() {
  const [uploads, setUploads] = useState<Map<string, UploadProgress>>(new Map());
  const { error: showError } = useToast();

  // Generate unique file ID
  const generateFileId = useCallback((file: File) => {
    return `${Date.now()}_${file.name}`;
  }, []);

  // Get file type category
  const getFileCategory = useCallback((mimeType: string): 'image' | 'video' | 'voice' | 'file' => {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'voice';
    return 'file';
  }, []);

  // Create thumbnail for image
  const createImageThumbnail = useCallback(async (file: File): Promise<{ blob: Blob; width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Max thumbnail size
        const maxSize = 300;
        let width = img.width;
        let height = img.height;

        if (width > height && width > maxSize) {
          height = (height / width) * maxSize;
          width = maxSize;
        } else if (height > maxSize) {
          width = (width / height) * maxSize;
          height = maxSize;
        }

        canvas.width = width;
        canvas.height = height;
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob((blob) => {
          URL.revokeObjectURL(objectUrl);
          if (blob) {
            resolve({ blob, width: img.width, height: img.height });
          } else {
            reject(new Error('Failed to create thumbnail'));
          }
        }, 'image/jpeg', 0.7);
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Failed to load image'));
      };

      img.src = objectUrl;
    });
  }, []);

  // Create video thumbnail
  const createVideoThumbnail = useCallback(async (file: File): Promise<{ blob: Blob; width: number; height: number; duration: number }> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const objectUrl = URL.createObjectURL(file);

      video.onloadedmetadata = () => {
        video.currentTime = 1; // Seek to 1 second
      };

      video.onseeked = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        const maxSize = 300;
        let width = video.videoWidth;
        let height = video.videoHeight;

        if (width > height && width > maxSize) {
          height = (height / width) * maxSize;
          width = maxSize;
        } else if (height > maxSize) {
          width = (width / height) * maxSize;
          height = maxSize;
        }

        canvas.width = width;
        canvas.height = height;
        ctx?.drawImage(video, 0, 0, width, height);

        canvas.toBlob((blob) => {
          URL.revokeObjectURL(objectUrl);
          if (blob) {
            resolve({
              blob,
              width: video.videoWidth,
              height: video.videoHeight,
              duration: Math.round(video.duration)
            });
          } else {
            reject(new Error('Failed to create video thumbnail'));
          }
        }, 'image/jpeg', 0.7);
      };

      video.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Failed to load video'));
      };

      video.src = objectUrl;
    });
  }, []);

  // Upload file to Supabase Storage
  const uploadFile = useCallback(async (
    file: File,
    messageId: string,
    conversationId: string
  ): Promise<{
    url: string;
    thumbnailUrl?: string;
    width?: number;
    height?: number;
    duration?: number;
  } | null> => {
    const fileId = generateFileId(file);
    const category = getFileCategory(file.type);

    try {
      // Validate file size (must match Supabase bucket limit)
      if (file.size > MAX_FILE_SIZE) {
        const sizeMB = (file.size / 1024 / 1024).toFixed(2);
        showError(`❌ Datei zu groß! ${sizeMB} MB (Max: ${MAX_FILE_SIZE_MB} MB)`);
        setUploads(prev => new Map(prev).set(fileId, {
          file,
          progress: 0,
          status: 'error',
          error: `File too large: ${sizeMB} MB`
        }));
        return null;
      }

      // Update progress: uploading
      setUploads(prev => new Map(prev).set(fileId, {
        file,
        progress: 0,
        status: 'uploading'
      }));

      // Generate file path
      const fileExt = file.name.split('.').pop();
      const fileName = `${conversationId}/${messageId}/${Date.now()}.${fileExt}`;

      // Upload main file
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(uploadData.path);

      setUploads(prev => new Map(prev).set(fileId, {
        file,
        progress: 50,
        status: 'processing'
      }));

      const result: {
        url: string;
        thumbnailUrl?: string;
        width?: number;
        height?: number;
        duration?: number;
      } = { url: urlData.publicUrl };

      // Generate thumbnail for images
      if (category === 'image') {
        try {
          const { blob, width, height } = await createImageThumbnail(file);
          const thumbFileName = `${conversationId}/${messageId}/thumb_${Date.now()}.jpg`;
          
          const { data: thumbData, error: thumbError } = await supabase.storage
            .from(STORAGE_BUCKET)
            .upload(thumbFileName, blob);

          if (!thumbError && thumbData) {
            const { data: thumbUrlData } = supabase.storage
              .from(STORAGE_BUCKET)
              .getPublicUrl(thumbData.path);
            
            result.thumbnailUrl = thumbUrlData.publicUrl;
            result.width = width;
            result.height = height;
          }
        } catch (err) {
          console.error('Thumbnail creation failed:', err);
          // Continue without thumbnail
        }
      }

      // Generate thumbnail for videos
      if (category === 'video') {
        try {
          const { blob, width, height, duration } = await createVideoThumbnail(file);
          const thumbFileName = `${conversationId}/${messageId}/thumb_${Date.now()}.jpg`;
          
          const { data: thumbData, error: thumbError } = await supabase.storage
            .from(STORAGE_BUCKET)
            .upload(thumbFileName, blob);

          if (!thumbError && thumbData) {
            const { data: thumbUrlData } = supabase.storage
              .from(STORAGE_BUCKET)
              .getPublicUrl(thumbData.path);
            
            result.thumbnailUrl = thumbUrlData.publicUrl;
            result.width = width;
            result.height = height;
            result.duration = duration;
          }
        } catch (err) {
          console.error('Video thumbnail creation failed:', err);
          // Continue without thumbnail
        }
      }

      // Get audio duration
      if (category === 'voice') {
        try {
          const audio = new Audio();
          const objectUrl = URL.createObjectURL(file);
          
          await new Promise<void>((resolve, reject) => {
            audio.onloadedmetadata = () => {
              result.duration = Math.round(audio.duration);
              URL.revokeObjectURL(objectUrl);
              resolve();
            };
            audio.onerror = () => {
              URL.revokeObjectURL(objectUrl);
              reject(new Error('Failed to load audio'));
            };
            audio.src = objectUrl;
          });
        } catch (err) {
          console.error('Audio duration extraction failed:', err);
        }
      }

      setUploads(prev => new Map(prev).set(fileId, {
        file,
        progress: 100,
        status: 'completed',
        url: result.url,
        ...(result.thumbnailUrl ? { thumbnailUrl: result.thumbnailUrl } : {})
      }));

      return result;
    } catch (err) {
      console.error('Upload error:', err);
      setUploads(prev => new Map(prev).set(fileId, {
        file,
        progress: 0,
        status: 'error',
        error: err instanceof Error ? err.message : 'Upload fehlgeschlagen'
      }));
      showError('Fehler beim Hochladen der Datei');
      return null;
    }
  }, [generateFileId, getFileCategory, createImageThumbnail, createVideoThumbnail, showError]);

  // Save attachment to database
  const saveAttachment = useCallback(async (
    messageId: string,
    file: File,
    uploadResult: {
      url: string;
      thumbnailUrl?: string;
      width?: number;
      height?: number;
      duration?: number;
    }
  ) => {
    try {
      const { error: insertError } = await supabase
        .from('message_attachments')
        .insert({
          message_id: messageId,
          file_url: uploadResult.url,
          file_name: file.name,
          file_type: file.type,
          file_size: file.size,
          thumbnail_url: uploadResult.thumbnailUrl || null,
          duration: uploadResult.duration || null,
          width: uploadResult.width || null,
          height: uploadResult.height || null
        });

      if (insertError) throw insertError;
    } catch (err) {
      console.error('Error saving attachment:', err);
      showError('Fehler beim Speichern des Anhangs');
    }
  }, [showError]);

  // Upload and attach file to message
  const uploadAndAttach = useCallback(async (
    file: File,
    messageId: string,
    conversationId: string
  ) => {
    const uploadResult = await uploadFile(file, messageId, conversationId);
    if (uploadResult) {
      await saveAttachment(messageId, file, uploadResult);
    }
    return uploadResult !== null;
  }, [uploadFile, saveAttachment]);

  // Upload multiple files
  const uploadMultiple = useCallback(async (
    files: File[],
    messageId: string,
    conversationId: string
  ) => {
    const results = await Promise.all(
      files.map(file => uploadAndAttach(file, messageId, conversationId))
    );
    return results.every(r => r === true);
  }, [uploadAndAttach]);

  // Clear completed uploads
  const clearUploads = useCallback(() => {
    setUploads(new Map());
  }, []);

  // Get upload progress for a file
  const getProgress = useCallback((fileName: string): UploadProgress | undefined => {
    for (const [, progress] of uploads) {
      if (progress.file.name === fileName) {
        return progress;
      }
    }
    return undefined;
  }, [uploads]);

  return {
    uploads: Array.from(uploads.values()),
    uploadFile,
    uploadAndAttach,
    uploadMultiple,
    clearUploads,
    getProgress
  };
}
