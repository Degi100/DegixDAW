// src/components/ui/Button.tsx
import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'error' | 'outline' | 'google' | 'discord';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
  children: ReactNode;
}

export default function Button({ 
  variant = 'primary', 
  size = 'medium', 
  fullWidth = false,
  className = '',
  children, 
  ...props 
}: ButtonProps) {
  const buttonClasses = [
    'btn',
    `btn-${variant}`,
    size !== 'medium' && `btn-${size}`,
    fullWidth && 'btn-full-width',
    className
  ].filter(Boolean).join(' ');

  return (
    <button className={buttonClasses} {...props}>
      {children}
    </button>
  );
}