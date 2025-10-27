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
  const shapeClass = shapeClasses[shape];
  const sizeClass = `avatar-${size}`;

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
      className={`avatar ${sizeClass} ${shapeClass} ${className}`}
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
