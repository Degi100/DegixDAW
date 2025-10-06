import { useCallback, useEffect } from 'react';

/**
 * Props for the useDragHandlers hook
 */
interface DragHandlersProps {
  isMobile: boolean;
  isPinned: boolean;
  isDragging: boolean;
  dragStart: { x: number; y: number } | null;
  setIsDragging: React.Dispatch<React.SetStateAction<boolean>>;
  setDragStart: React.Dispatch<React.SetStateAction<{ x: number; y: number } | null>>;
  setSidebarPosition: React.Dispatch<React.SetStateAction<{ top: number; right: number }>>;
}

/**
 * Custom hook for handling sidebar drag interactions
 *
 * Provides mouse event handlers for dragging the sidebar around the screen.
 * Manages drag state and updates position based on mouse movements.
 *
 * @param props - Configuration object with state and setters
 * @returns Object containing drag start handler
 */
export function useDragHandlers({
  isMobile,
  isPinned,
  isDragging,
  dragStart,
  setIsDragging,
  setDragStart,
  setSidebarPosition,
}: DragHandlersProps) {
  const handleDragStart = useCallback((e: React.MouseEvent) => {
    if (isMobile || !isPinned) return;
    if ((e.target as HTMLElement).closest('button')) return;
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  }, [isMobile, isPinned, setIsDragging, setDragStart]);

  useEffect(() => {
    if (!isDragging || !dragStart) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = dragStart.x - e.clientX;
      const deltaY = e.clientY - dragStart.y;
      
      setSidebarPosition(prev => ({
        top: Math.max(0, prev.top + deltaY),
        right: Math.max(0, prev.right + deltaX)
      }));
      
      setDragStart({ x: e.clientX, y: e.clientY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setDragStart(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart, setIsDragging, setDragStart, setSidebarPosition]);

  return {
    handleDragStart,
  };
}