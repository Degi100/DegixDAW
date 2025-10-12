/**
 * Shared constants for DegixDAW
 *
 * This package contains constants shared between:
 * - web/frontend (React app)
 * - web/backend (Express API)
 * - desktop (Electron/Tauri app)
 */

// User Roles
export const USER_ROLES = {
  USER: 'user',
  BETA_USER: 'beta_user',
  MODERATOR: 'moderator',
  ADMIN: 'admin',
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

// Audio Settings
export const AUDIO_SETTINGS = {
  SAMPLE_RATE: 48000,
  BUFFER_SIZE: 512,
  BIT_DEPTH: 24,
} as const;

// API Endpoints
export const API_ENDPOINTS = {
  AUTH: '/api/auth',
  USERS: '/api/users',
  PROJECTS: '/api/projects',
  TRACKS: '/api/tracks',
  MESSAGES: '/api/messages',
} as const;

// Feature Flags
export const FEATURES = {
  DASHBOARD: 'dashboard',
  SOCIAL_FEATURES: 'social_features',
  FILE_BROWSER: 'file_browser',
  DAW_INTEGRATION: 'daw_integration',
} as const;

// Validation Rules
export const VALIDATION = {
  USERNAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 20,
    PATTERN: /^[a-z0-9_-]+$/,
  },
  PASSWORD: {
    MIN_LENGTH: 6,
  },
  PROJECT_NAME: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 100,
  },
} as const;

// Add more shared constants as needed
