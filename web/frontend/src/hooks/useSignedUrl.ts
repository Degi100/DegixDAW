// src/hooks/useSignedUrl.ts
// Hook to generate signed URLs for Supabase Storage files

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { STORAGE_BUCKET } from '../lib/constants/storage';

const SIGNED_URL_EXPIRY = 3600; // 1 hour in seconds

// Cache for signed URLs to avoid regenerating them
const urlCache = new Map<string, { url: string; expiresAt: number }>();

/**
 * Generate a signed URL for a storage path
 * Returns null if path is invalid or generation fails
 */
export async function getSignedUrl(storagePath: string | null | undefined): Promise<string | null> {
  if (!storagePath) return null;

  // Check cache first
  const cached = urlCache.get(storagePath);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.url;
  }

  try {
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(storagePath, SIGNED_URL_EXPIRY);

    if (error) {
      // Silently fail for "Object not found" (file was deleted from storage)
      if (error.message?.includes('Object not found')) {
        return null;
      }
      console.warn('Failed to create signed URL:', error.message);
      return null;
    }

    if (!data?.signedUrl) {
      return null;
    }

    // Cache the URL (expire 5 minutes before actual expiry for safety)
    urlCache.set(storagePath, {
      url: data.signedUrl,
      expiresAt: Date.now() + (SIGNED_URL_EXPIRY - 300) * 1000
    });

    return data.signedUrl;
  } catch (err) {
    console.warn('Error generating signed URL:', err);
    return null;
  }
}

/**
 * React Hook: Get a signed URL for a storage path
 * Automatically refreshes when path changes
 */
export function useSignedUrl(storagePath: string | null | undefined): string | null {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!storagePath) {
      setSignedUrl(null);
      return;
    }

    let mounted = true;

    getSignedUrl(storagePath).then(url => {
      if (mounted) {
        setSignedUrl(url);
      }
    });

    return () => {
      mounted = false;
    };
  }, [storagePath]);

  return signedUrl;
}

/**
 * Clear the URL cache (useful when logging out)
 */
export function clearSignedUrlCache() {
  urlCache.clear();
}
