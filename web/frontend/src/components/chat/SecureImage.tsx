// src/components/chat/SecureImage.tsx
// Image component that automatically generates signed URLs for storage paths

import React from 'react';
import { useSignedUrl } from '../../hooks/useSignedUrl';

interface SecureImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  storagePath: string | null | undefined;
  fallbackSrc?: string;
}

/**
 * Secure Image Component
 * Automatically converts storage paths to signed URLs
 * Shows loading state while generating URL
 */
export const SecureImage: React.FC<SecureImageProps> = ({
  storagePath,
  fallbackSrc,
  alt = '',
  className = '',
  ...props
}) => {
  const signedUrl = useSignedUrl(storagePath);

  // Show loading placeholder while generating signed URL
  if (!signedUrl && !fallbackSrc) {
    return (
      <div
        className={`secure-image-loading ${className}`}
        style={{
          background: '#f0f0f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100px'
        }}
      >
        <span style={{ color: '#999' }}>Lädt...</span>
      </div>
    );
  }

  return (
    <img
      src={signedUrl || fallbackSrc || ''}
      alt={alt}
      className={className}
      {...props}
    />
  );
};

export default SecureImage;
