// ============================================
// AVATAR SERVICE
// Handles avatar upload, resize, and storage
// ============================================

import { supabase } from '../supabase';

export interface AvatarUploadResult {
  success: boolean;
  avatarUrl?: string;
  error?: string;
}

// ============================================
// Resize Image (Client-side via Canvas API)
// ============================================

export async function resizeImage(
  file: File,
  maxWidth: number = 512,
  maxHeight: number = 512
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }

    img.onload = () => {
      // Calculate new dimensions (maintain aspect ratio)
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }

      // Resize to square (crop center)
      const size = Math.min(width, height);
      canvas.width = size;
      canvas.height = size;

      // Draw image (crop center)
      const x = (img.width - size) / 2;
      const y = (img.height - size) / 2;
      ctx.drawImage(img, x, y, size, size, 0, 0, size, size);

      // Convert to Blob (JPEG, 85% quality)
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create blob from canvas'));
          }
        },
        'image/jpeg',
        0.85
      );
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    img.src = URL.createObjectURL(file);
  });
}

// ============================================
// Upload Avatar
// ============================================

export async function uploadAvatar(file: File): Promise<AvatarUploadResult> {
  try {
    // 1. Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: 'User not authenticated' };
    }

    // 2. Validate file type
    if (!file.type.startsWith('image/')) {
      return { success: false, error: 'File must be an image' };
    }

    // 3. Validate file size (max 5MB before resize)
    if (file.size > 5 * 1024 * 1024) {
      return { success: false, error: 'Image too large (max 5MB)' };
    }

    // 4. Resize image (512x512, JPEG)
    const resizedBlob = await resizeImage(file, 512, 512);

    // 5. Generate unique filename
    const timestamp = Date.now();
    const filename = `${user.id}/avatar-${timestamp}.jpg`;

    // 6. Delete old avatar (if exists)
    const { data: profile } = await supabase
      .from('profiles')
      .select('avatar_url')
      .eq('id', user.id)
      .single();

    if (profile?.avatar_url) {
      // Extract filename from old URL
      const oldPath = profile.avatar_url.split('/').pop();
      if (oldPath) {
        await supabase.storage
          .from('avatars')
          .remove([`${user.id}/${oldPath}`]);
      }
    }

    // 7. Upload new avatar to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filename, resizedBlob, {
        contentType: 'image/jpeg',
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return { success: false, error: `Upload failed: ${uploadError.message}` };
    }

    // 8. Get public URL
    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(filename);

    if (!urlData?.publicUrl) {
      return { success: false, error: 'Failed to get public URL' };
    }

    // 9. Update profiles table with new avatar_url
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: urlData.publicUrl })
      .eq('id', user.id);

    if (updateError) {
      console.error('Profile update error:', updateError);
      return { success: false, error: `Failed to update profile: ${updateError.message}` };
    }

    // 10. Update auth.users.user_metadata (for immediate UI update)
    const { error: metadataError } = await supabase.auth.updateUser({
      data: { avatar_url: urlData.publicUrl },
    });

    if (metadataError) {
      console.warn('Metadata update warning:', metadataError);
      // Non-critical error, continue
    }

    return { success: true, avatarUrl: urlData.publicUrl };
  } catch (error) {
    console.error('uploadAvatar failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================
// Remove Avatar
// ============================================

export async function removeAvatar(): Promise<AvatarUploadResult> {
  try {
    // 1. Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: 'User not authenticated' };
    }

    // 2. Get current avatar_url
    const { data: profile } = await supabase
      .from('profiles')
      .select('avatar_url')
      .eq('id', user.id)
      .single();

    if (!profile?.avatar_url) {
      return { success: true }; // No avatar to remove
    }

    // 3. Extract filename from URL
    const filename = profile.avatar_url.split('/').pop();
    if (!filename) {
      return { success: false, error: 'Invalid avatar URL' };
    }

    // 4. Delete from storage
    const { error: deleteError } = await supabase.storage
      .from('avatars')
      .remove([`${user.id}/${filename}`]);

    if (deleteError) {
      console.error('Delete error:', deleteError);
      // Continue anyway to clear DB reference
    }

    // 5. Clear avatar_url in profiles table
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: null })
      .eq('id', user.id);

    if (updateError) {
      return { success: false, error: `Failed to update profile: ${updateError.message}` };
    }

    // 6. Clear auth.users.user_metadata
    const { error: metadataError } = await supabase.auth.updateUser({
      data: { avatar_url: null },
    });

    if (metadataError) {
      console.warn('Metadata update warning:', metadataError);
    }

    return { success: true };
  } catch (error) {
    console.error('removeAvatar failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
