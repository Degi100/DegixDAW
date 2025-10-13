import { useState, useCallback } from 'react';
import {
  DEFAULT_SIDEBAR_WIDTH,
  DEFAULT_SIDEBAR_HEIGHT_OFFSET,
  DEFAULT_SIDEBAR_TOP,
  DEFAULT_SIDEBAR_RIGHT,
} from '../components/chat/constants';

/**
 * State interface for sidebar dimensions and interaction states
 */
export interface SidebarState {
  sidebarWidth: number;
  sidebarHeight: number;
  sidebarPosition: { top: number; right: number };
  isResizingLeft: boolean;
  isResizingRight: boolean;
  isResizingTop: boolean;
  isResizingBottom: boolean;
  isDragging: boolean;
  dragStart: { x: number; y: number } | null;
  isGradientEnabled: boolean;
  isPinned: boolean;
}

/**
 * Actions interface for sidebar state management
 */
export interface SidebarActions {
  setSidebarWidth: React.Dispatch<React.SetStateAction<number>>;
  setSidebarHeight: React.Dispatch<React.SetStateAction<number>>;
  setSidebarPosition: React.Dispatch<React.SetStateAction<{ top: number; right: number }>>;
  setIsResizingLeft: React.Dispatch<React.SetStateAction<boolean>>;
  setIsResizingRight: React.Dispatch<React.SetStateAction<boolean>>;
  setIsResizingTop: React.Dispatch<React.SetStateAction<boolean>>;
  setIsResizingBottom: React.Dispatch<React.SetStateAction<boolean>>;
  setIsDragging: React.Dispatch<React.SetStateAction<boolean>>;
  setDragStart: React.Dispatch<React.SetStateAction<{ x: number; y: number } | null>>;
  setIsGradientEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  setIsPinned: React.Dispatch<React.SetStateAction<boolean>>;
  resetPosition: () => void;
  handleViewAllChats: () => void;
  handleToggleGradient: () => void;
  handleTogglePin: () => void;
  handleResetPosition: () => void;
}

/**
 * Custom hook for managing sidebar state
 *
 * Manages all state related to sidebar positioning, sizing, and interaction modes.
 * Provides both state values and setter functions for complete control.
 *
 * @returns Object containing sidebar state and actions
 */
export function useSidebarState(): SidebarState & SidebarActions {
  const [sidebarWidth, setSidebarWidth] = useState<number>(DEFAULT_SIDEBAR_WIDTH);
  const [sidebarHeight, setSidebarHeight] = useState<number>(window.innerHeight - DEFAULT_SIDEBAR_HEIGHT_OFFSET);
  const [sidebarPosition, setSidebarPosition] = useState<{ top: number; right: number }>({ top: DEFAULT_SIDEBAR_TOP, right: DEFAULT_SIDEBAR_RIGHT });
  const [isResizingLeft, setIsResizingLeft] = useState<boolean>(false);
  const [isResizingRight, setIsResizingRight] = useState<boolean>(false);
  const [isResizingTop, setIsResizingTop] = useState<boolean>(false);
  const [isResizingBottom, setIsResizingBottom] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [isGradientEnabled, setIsGradientEnabled] = useState<boolean>(true);
  const [isPinned, setIsPinned] = useState<boolean>(false);

  const resetPosition = () => {
    setSidebarWidth(DEFAULT_SIDEBAR_WIDTH);
    setSidebarHeight(window.innerHeight - DEFAULT_SIDEBAR_HEIGHT_OFFSET);
    setSidebarPosition({ top: DEFAULT_SIDEBAR_TOP, right: DEFAULT_SIDEBAR_RIGHT });
  };

  const handleViewAllChats = () => {
    window.location.href = '/chat';
  };

  const handleToggleGradient = useCallback(() => {
    setIsGradientEnabled(prev => !prev);
  }, []);

  const handleTogglePin = useCallback(() => {
    setIsPinned(prev => !prev);
  }, []);

  const handleResetPosition = useCallback(() => {
    setSidebarWidth(DEFAULT_SIDEBAR_WIDTH);
    setSidebarHeight(window.innerHeight - DEFAULT_SIDEBAR_HEIGHT_OFFSET);
    setSidebarPosition({ top: DEFAULT_SIDEBAR_TOP, right: DEFAULT_SIDEBAR_RIGHT });
  }, [setSidebarWidth, setSidebarHeight, setSidebarPosition]);

  return {
    sidebarWidth,
    sidebarHeight,
    sidebarPosition,
    isResizingLeft,
    isResizingRight,
    isResizingTop,
    isResizingBottom,
    isDragging,
    dragStart,
    isGradientEnabled,
    isPinned,
    setSidebarWidth,
    setSidebarHeight,
    setSidebarPosition,
    setIsResizingLeft,
    setIsResizingRight,
    setIsResizingTop,
    setIsResizingBottom,
    setIsDragging,
    setDragStart,
    setIsGradientEnabled,
    setIsPinned,
    resetPosition,
    handleViewAllChats,
    handleToggleGradient,
    handleTogglePin,
    handleResetPosition,
  };
}