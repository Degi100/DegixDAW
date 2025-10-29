import React from 'react';

/**
 * Props for the ResizeHandles component
 */
interface ResizeHandlesProps {
  /** Whether the device is mobile */
  isMobile: boolean;
  /** Whether the sidebar is pinned */
  isPinned: boolean;
  /** Handler for starting left resize */
  onResizeLeftStart: (e: React.MouseEvent) => void;
  /** Handler for starting right resize */
  onResizeRightStart: (e: React.MouseEvent) => void;
  /** Handler for starting top resize */
  onResizeTopStart: (e: React.MouseEvent) => void;
  /** Handler for starting bottom resize */
  onResizeBottomStart: (e: React.MouseEvent) => void;
}

/**
 * ResizeHandles component provides drag handles for resizing the sidebar
 *
 * Renders four invisible drag handles around the sidebar edges for resizing.
 * Always visible and interactive (both pinned and unpinned modes) except on mobile devices.
 *
 * @param props - Component props
 * @returns JSX.Element or null
 */
export function ResizeHandles({
  isMobile,
  onResizeLeftStart,
  onResizeRightStart,
  onResizeTopStart,
  onResizeBottomStart,
}: ResizeHandlesProps) {
  if (isMobile) {
    return null; // Only hide on mobile
  }

  return (
    <>
      <div
        className="chat-sidebar-resize-handle chat-sidebar-resize-handle--left"
        onMouseDown={onResizeLeftStart}
      />
      <div
        className="chat-sidebar-resize-handle chat-sidebar-resize-handle--right"
        onMouseDown={onResizeRightStart}
      />
      <div
        className="chat-sidebar-resize-handle chat-sidebar-resize-handle--top"
        onMouseDown={onResizeTopStart}
      />
      <div
        className="chat-sidebar-resize-handle chat-sidebar-resize-handle--bottom"
        onMouseDown={onResizeBottomStart}
      />
    </>
  );
}