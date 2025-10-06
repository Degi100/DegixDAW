import { useCallback, useEffect } from 'react';
import {
  MIN_SIDEBAR_WIDTH,
  MIN_SIDEBAR_HEIGHT,
  MIN_SIDEBAR_TOP,
  MIN_SIDEBAR_RIGHT,
  MAX_SIDEBAR_WIDTH_OFFSET,
} from '../components/chat/constants';

/**
 * Props for the useResizeHandlers hook
 */
interface ResizeHandlersProps {
  isMobile: boolean;
  isPinned: boolean;
  sidebarPosition: { top: number; right: number };
  isResizingLeft: boolean;
  isResizingRight: boolean;
  isResizingTop: boolean;
  isResizingBottom: boolean;
  setSidebarWidth: React.Dispatch<React.SetStateAction<number>>;
  setSidebarHeight: React.Dispatch<React.SetStateAction<number>>;
  setSidebarPosition: React.Dispatch<React.SetStateAction<{ top: number; right: number }>>;
  setIsResizingLeft: React.Dispatch<React.SetStateAction<boolean>>;
  setIsResizingRight: React.Dispatch<React.SetStateAction<boolean>>;
  setIsResizingTop: React.Dispatch<React.SetStateAction<boolean>>;
  setIsResizingBottom: React.Dispatch<React.SetStateAction<boolean>>;
}

/**
 * Custom hook for handling sidebar resize interactions
 *
 * Provides mouse event handlers for resizing the sidebar from all four sides.
 * Manages the resize state and updates dimensions based on mouse movements.
 *
 * @param props - Configuration object with state and setters
 * @returns Object containing resize start handlers
 */
export function useResizeHandlers({
  isMobile,
  isPinned,
  sidebarPosition,
  isResizingLeft,
  isResizingRight,
  isResizingTop,
  isResizingBottom,
  setSidebarWidth,
  setSidebarHeight,
  setSidebarPosition,
  setIsResizingLeft,
  setIsResizingRight,
  setIsResizingTop,
  setIsResizingBottom,
}: ResizeHandlersProps) {
  const handleResizeLeftStart = useCallback((e: React.MouseEvent) => {
    if (isMobile || !isPinned) return;
    e.preventDefault();
    e.stopPropagation();
    setIsResizingLeft(true);
  }, [isMobile, isPinned, setIsResizingLeft]);

  const handleResizeRightStart = useCallback((e: React.MouseEvent) => {
    if (isMobile || !isPinned) return;
    e.preventDefault();
    e.stopPropagation();
    setIsResizingRight(true);
  }, [isMobile, isPinned, setIsResizingRight]);

  const handleResizeTopStart = useCallback((e: React.MouseEvent) => {
    if (isMobile || !isPinned) return;
    e.preventDefault();
    e.stopPropagation();
    setIsResizingTop(true);
  }, [isMobile, isPinned, setIsResizingTop]);

  const handleResizeBottomStart = useCallback((e: React.MouseEvent) => {
    if (isMobile || !isPinned) return;
    e.preventDefault();
    e.stopPropagation();
    setIsResizingBottom(true);
  }, [isMobile, isPinned, setIsResizingBottom]);

  // Resize effects
  useEffect(() => {
    if (!isResizingLeft) return;
    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = window.innerWidth - e.clientX - sidebarPosition.right;
      setSidebarWidth(Math.max(MIN_SIDEBAR_WIDTH, Math.min(window.innerWidth - MAX_SIDEBAR_WIDTH_OFFSET, newWidth)));
    };
    const handleMouseUp = () => setIsResizingLeft(false);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingLeft, sidebarPosition.right, setIsResizingLeft, setSidebarWidth]);

  useEffect(() => {
    if (!isResizingRight) return;
    const handleMouseMove = (e: MouseEvent) => {
      const newRight = window.innerWidth - e.clientX;
      setSidebarPosition(prev => ({ ...prev, right: Math.max(MIN_SIDEBAR_RIGHT, newRight) }));
    };
    const handleMouseUp = () => setIsResizingRight(false);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingRight, setIsResizingRight, setSidebarPosition]);

  useEffect(() => {
    if (!isResizingTop) return;
    const handleMouseMove = (e: MouseEvent) => {
      const newTop = e.clientY;
      const newHeight = window.innerHeight - newTop;
      setSidebarPosition(prev => ({ ...prev, top: Math.max(MIN_SIDEBAR_TOP, newTop) }));
      setSidebarHeight(Math.max(MIN_SIDEBAR_HEIGHT, newHeight));
    };
    const handleMouseUp = () => setIsResizingTop(false);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingTop, setIsResizingTop, setSidebarHeight, setSidebarPosition]);

  useEffect(() => {
    if (!isResizingBottom) return;
    const handleMouseMove = (e: MouseEvent) => {
      const newHeight = window.innerHeight - e.clientY;
      setSidebarHeight(Math.max(MIN_SIDEBAR_HEIGHT, newHeight));
    };
    const handleMouseUp = () => setIsResizingBottom(false);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingBottom, setIsResizingBottom, setSidebarHeight]);

  return {
    handleResizeLeftStart,
    handleResizeRightStart,
    handleResizeTopStart,
    handleResizeBottomStart,
  };
}