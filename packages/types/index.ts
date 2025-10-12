/**
 * Shared TypeScript types for DegixDAW
 *
 * This package contains types shared between:
 * - web/frontend (React app)
 * - web/backend (Express API)
 * - desktop (Electron/Tauri app)
 */

// User & Authentication
export interface User {
  id: string;
  email: string;
  username: string;
  full_name?: string;
  role: 'user' | 'beta_user' | 'moderator' | 'admin';
  created_at: string;
  updated_at: string;
}

// Project & DAW
export interface Project {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

// Audio & VST
export interface AudioTrack {
  id: string;
  project_id: string;
  name: string;
  type: 'audio' | 'midi' | 'instrument';
  volume: number;
  pan: number;
}

// Chat & Social
export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

// Add more shared types as needed
