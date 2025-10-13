// src/components/layout/Container.tsx
import type { ReactNode } from 'react';

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
  const sizeClass = size === 'narrow' ? 'container-narrow' : 
                   size === 'wide' ? 'container-wide' : 'container';
  
  const containerClasses = [sizeClass, className].filter(Boolean).join(' ');

  return (
    <div className={containerClasses}>
      {children}
    </div>
  );
}