// ============================================
// FLOATING FILE BROWSER CONTAINER
// Portal-based floating window wrapper
// ============================================

import { createPortal } from 'react-dom';
import { useRef, useEffect } from 'react';
import type { UseFloatingFileBrowserReturn } from '../../hooks/useFloatingFileBrowser';

interface FloatingFileBrowserContainerProps {
  children: React.ReactNode;
  floatingState: UseFloatingFileBrowserReturn;
  onClose: () => void;
}

export default function FloatingFileBrowserContainer({
  children,
  floatingState,
  onClose,
}: FloatingFileBrowserContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  const {
    isPinned,
    width,
    height,
    position,
    isDragging,
    isMinimized,
    setPosition,
    setIsDragging,
    togglePin,
    toggleMinimize,
  } = floatingState;

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isPinned) return;

    // Only drag if clicking on header
    const target = e.target as HTMLElement;
    if (!headerRef.current?.contains(target)) return;

    // Don't drag if clicking on buttons
    if (target.closest('button')) return;

    setIsDragging(true);

    const offsetX = e.clientX - position.left;
    const offsetY = e.clientY - position.top;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const newLeft = moveEvent.clientX - offsetX;
      const newTop = moveEvent.clientY - offsetY;

      // Boundary checks
      const maxLeft = window.innerWidth - 200; // Min 200px visible
      const maxTop = window.innerHeight - 100; // Min 100px visible

      setPosition({
        left: Math.max(0, Math.min(newLeft, maxLeft)),
        top: Math.max(0, Math.min(newTop, maxTop)),
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // ESC to close
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isPinned) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isPinned, onClose]);

  const containerClass = `
    floating-file-browser
    ${isPinned ? 'floating-file-browser--pinned' : ''}
    ${isDragging ? 'floating-file-browser--dragging' : ''}
    ${isMinimized ? 'floating-file-browser--minimized' : ''}
  `.trim();

  const containerStyle: React.CSSProperties = {
    left: `${position.left}px`,
    top: `${position.top}px`,
    width: `${width}px`,
    height: isMinimized ? 'auto' : `${height}px`,
  };

  const content = (
    <>
      {/* Backdrop overlay (only when not pinned) */}
      {!isPinned && (
        <div
          className="floating-file-browser-backdrop"
          onClick={onClose}
        />
      )}

      {/* Floating window */}
      <div
        ref={containerRef}
        className={containerClass}
        style={containerStyle}
      >
        {/* Header with drag handle */}
        <div
          ref={headerRef}
          className="floating-file-browser-header"
          onMouseDown={handleMouseDown}
        >
          <div className="floating-file-browser-title">
            <span className="title-icon">📁</span>
            <span className="title-text">Datei-Browser</span>
          </div>

          <div className="floating-file-browser-actions">
            <button
              className="action-btn"
              onClick={togglePin}
              title={isPinned ? 'Ablösen' : 'Andocken'}
            >
              {isPinned ? '📌' : '📍'}
            </button>
            <button
              className="action-btn"
              onClick={toggleMinimize}
              title={isMinimized ? 'Maximieren' : 'Minimieren'}
            >
              {isMinimized ? '🔲' : '➖'}
            </button>
            <button
              className="action-btn action-btn--close"
              onClick={onClose}
              title="Schließen"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content (hidden when minimized) */}
        {!isMinimized && (
          <div className="floating-file-browser-content">
            {children}
          </div>
        )}
      </div>
    </>
  );

  return createPortal(content, document.body);
}
