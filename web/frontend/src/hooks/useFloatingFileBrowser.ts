// ============================================
// USE FLOATING FILE BROWSER HOOK
// State management for floating file browser window
// ============================================

import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'floatingFileBrowserState';
const DEFAULT_WIDTH = 1200;  // Larger for file browser
const DEFAULT_HEIGHT = 800;  // Taller for better view
const DEFAULT_POSITION = { top: 60, left: 100 };

interface FloatingState {
  width: number;
  height: number;
  position: { top: number; left: number };
}

export interface UseFloatingFileBrowserReturn {
  // State
  isFloating: boolean;
  isPinned: boolean;
  width: number;
  height: number;
  position: { top: number; left: number };
  isDragging: boolean;
  isResizing: boolean;
  isMinimized: boolean;

  // Actions
  setIsFloating: (value: boolean) => void;
  toggleFloating: () => void;
  togglePin: () => void;
  toggleMinimize: () => void;
  setPosition: (pos: { top: number; left: number }) => void;
  setSize: (size: { width: number; height: number }) => void;
  setIsDragging: (value: boolean) => void;
  setIsResizing: (value: boolean) => void;
  resetPosition: () => void;
}

export function useFloatingFileBrowser(): UseFloatingFileBrowserReturn {
  // Load initial state from localStorage
  const loadState = (): FloatingState => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.warn('Failed to load floating state:', error);
    }
    return {
      width: DEFAULT_WIDTH,
      height: DEFAULT_HEIGHT,
      position: DEFAULT_POSITION,
    };
  };

  const [isFloating, setIsFloating] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  const initialState = loadState();
  const [width, setWidth] = useState(initialState.width);
  const [height, setHeight] = useState(initialState.height);
  const [position, setPosition] = useState(initialState.position);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (isFloating) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ width, height, position }));
      } catch (error) {
        console.warn('Failed to save floating state:', error);
      }
    }
  }, [isFloating, width, height, position]);

  const toggleFloating = useCallback(() => {
    setIsFloating(prev => !prev);
    if (isFloating) {
      // When closing floating mode, reset pin state
      setIsPinned(false);
      setIsMinimized(false);
    }
  }, [isFloating]);

  const togglePin = useCallback(() => {
    setIsPinned(prev => !prev);
    // No position/size changes - CSS handles the pinned state visually
  }, []);

  const toggleMinimize = useCallback(() => {
    setIsMinimized(prev => !prev);
  }, []);

  const setSize = useCallback((size: { width: number; height: number }) => {
    setWidth(size.width);
    setHeight(size.height);
  }, []);

  const resetPosition = useCallback(() => {
    setWidth(DEFAULT_WIDTH);
    setHeight(DEFAULT_HEIGHT);
    setPosition(DEFAULT_POSITION);
  }, []);

  return {
    isFloating,
    isPinned,
    width,
    height,
    position,
    isDragging,
    isResizing,
    isMinimized,
    setIsFloating,
    toggleFloating,
    togglePin,
    toggleMinimize,
    setPosition,
    setSize,
    setIsDragging,
    setIsResizing,
    resetPosition,
  };
}
