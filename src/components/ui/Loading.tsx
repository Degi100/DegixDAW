// src/components/ui/Loading.tsx
import type { ReactNode } from 'react';
import styles from './Loading.module.css';

interface SpinnerProps {
  size?: 'small' | 'medium' | 'large';
  variant?: 'primary' | 'white';
  className?: string;
}

export function Spinner({ size = 'medium', variant = 'white', className = '' }: SpinnerProps) {
  const spinnerClasses = [
    styles.spinner,
    size !== 'medium' && styles[size],
    variant !== 'white' && styles[variant],
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
    <div className={styles.loadingOverlay}>
      <div className={styles.loadingContainer}>
        <Spinner size="large" variant="primary" />
        {message && <p className={styles.loadingText}>{message}</p>}
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
            className={`${styles.skeleton} ${styles.skeletonParagraph}`}
          />
        ))}
      </div>
    );
  }

  const skeletonClasses = [
    styles.skeleton,
    variant === 'text' && styles.skeletonText,
    variant === 'title' && styles.skeletonTitle,
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