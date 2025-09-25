// src/components/layout/Container.tsx
import type { ReactNode } from 'react';
import styles from './Container.module.css';

interface ContainerProps {
  children: ReactNode;
  size?: 'narrow' | 'normal' | 'wide';
  className?: string;
}

export default function Container({ 
  children, 
  size = 'normal', 
  className = '' 
}: ContainerProps) {
  const containerClasses = [
    styles.container,
    size !== 'normal' && styles[size],
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={containerClasses}>
      {children}
    </div>
  );
}