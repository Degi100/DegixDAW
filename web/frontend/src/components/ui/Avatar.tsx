// ============================================
// AVATAR COMPONENT
// Reusable avatar with automatic fallback to initials
// ============================================

import React from 'react';

export interface AvatarProps {
  avatarUrl?: string | null;
  initial: string;
  fullName?: string;
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  className?: string;
  shape?: 'circle' | 'rounded' | 'square';
}

const sizeClasses = {
  small: { width: 32, height: 32, fontSize: '0.875rem' },
  medium: { width: 48, height: 48, fontSize: '1rem' },
  large: { width: 64, height: 64, fontSize: '1.25rem' },
  xlarge: { width: 80, height: 80, fontSize: '1.75rem' },
};

const shapeClasses = {
  circle: 'rounded-full',
  rounded: 'rounded-lg',
  square: 'rounded-none',
};

export default function Avatar({
  avatarUrl,
  initial,
  fullName,
  size = 'medium',
  className = '',
  shape = 'rounded',
}: AvatarProps) {
  const sizeStyle = sizeClasses[size];
  const shapeClass = shapeClasses[shape];

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    // Hide broken image and show fallback initial
    e.currentTarget.style.display = 'none';
    const parent = e.currentTarget.parentElement;
    if (parent) {
      parent.classList.add('avatar-fallback');
      parent.textContent = initial;
    }
  };

  return (
    <div
      className={`avatar ${shapeClass} ${className}`}
      style={{
        width: sizeStyle.width,
        height: sizeStyle.height,
        fontSize: sizeStyle.fontSize,
      }}
      title={fullName}
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={fullName || initial}
          className="avatar-image"
          onError={handleImageError}
        />
      ) : (
        <span className="avatar-initial">{initial}</span>
      )}
    </div>
  );
}
