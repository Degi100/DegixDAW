import React from 'react';

interface MockDataBadgeProps {
  variant?: 'badge' | 'banner';
  message?: string;
  tooltip?: string;
}

export const MockDataBadge: React.FC<MockDataBadgeProps> = ({
  variant = 'badge',
  message = 'Mock-Daten',
  tooltip = 'Diese Daten sind noch nicht mit dem Backend verbunden'
}) => {
  if (variant === 'banner') {
    return (
      <div className="mock-data-banner" title={tooltip}>
        <svg 
          className="mock-data-banner__icon" 
          width="20" 
          height="20" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
        >
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        <span className="mock-data-banner__text">{message}</span>
      </div>
    );
  }

  return (
    <span className="mock-data-badge" title={tooltip}>
      <svg 
        className="mock-data-badge__icon" 
        width="14" 
        height="14" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <span className="mock-data-badge__text">{message}</span>
    </span>
  );
};
