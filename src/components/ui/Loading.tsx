// src/components/ui/Loading.tsx
import type { ReactNode } from 'react';

interface SpinnerProps {
  size?: 'small' | 'medium' | 'large';
  variant?: 'primary' | 'white';
  className?: string;
}

export function Spinner({ size = 'medium', variant = 'white', className = '' }: SpinnerProps) {
  const spinnerClasses = [
    'spinner',
    size !== 'medium' && `spinner-${size}`,
    variant !== 'white' && `spinner-${variant}`,
    className
  ].filter(Boolean).join(' ');

  return <div className={spinnerClasses} />;
}

interface LoadingOverlayProps {
  message?: string;
  children?: ReactNode;
}

export function LoadingOverlay({ message = 'Lädt...', children }: LoadingOverlayProps) {
  return (
    <div className="loading-overlay">
      <div className="loading-content">
        <Spinner size="large" variant="primary" />
        {message && <p className="loading-text">{message}</p>}
        {children}
      </div>
    </div>
  );
}

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  variant?: 'text' | 'title' | 'paragraph';
  lines?: number;
  className?: string;
}

export function Skeleton({ 
  width, 
  height, 
  variant = 'text', 
  lines = 1, 
  className = '' 
}: SkeletonProps) {
  if (variant === 'paragraph') {
    return (
      <div className={className}>
        {Array.from({ length: lines }, (_, i) => (
          <div 
            key={i}
            className="skeleton skeleton-paragraph"
          />
        ))}
      </div>
    );
  }

  const skeletonClasses = [
    'skeleton',
    variant === 'text' && 'skeleton-text',
    variant === 'title' && 'skeleton-title',
    className
  ].filter(Boolean).join(' ');

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return <div className={skeletonClasses} style={style} />;
}

interface LoadingCardProps {
  title?: boolean;
  lines?: number;
  className?: string;
}

export function LoadingCard({ title = true, lines = 3, className = '' }: LoadingCardProps) {
  return (
    <div className={className}>
      {title && <Skeleton variant="title" />}
      <Skeleton variant="paragraph" lines={lines} />
    </div>
  );
}