// src/pages/admin/types/admin.types.ts
// Shared TypeScript interfaces for Admin components

import type { UserProfile } from '../../../hooks/useUserData';

// ============================================
// USER MANAGEMENT TYPES
// ============================================

export interface NewUserData {
  email: string;
  password: string;
  full_name: string;
  username: string;
  role: 'admin' | 'user' | 'moderator';
  phone: string;
  sendWelcomeEmail: boolean;
}

export type ExportFormat = 'csv' | 'json' | 'xlsx';

export interface UserStats {
  total: number;
  active: number;
  inactive: number;
  pending: number;
  admins: number;
  recentSignups: number;
  last24h: number;
  last7d: number;
  last30d: number;
}

// ============================================
// SETTINGS TYPES
// ============================================

export interface SystemInfo {
  appVersion: string;
  dbStatus: 'connected' | 'disconnected' | 'error';
  apiStatus: 'online' | 'offline' | 'degraded';
  lastBackup: string;
  totalUsers: number;
  totalStorage: string;
}

export interface SecuritySettings {
  sessionTimeout: number;
  minPasswordLength: number;
  requireSpecialChars: boolean;
  require2FA: boolean;
  maxLoginAttempts: number;
  lockoutDuration: number;
}

export interface AppSettings {
  maintenanceMode: boolean;
  allowRegistration: boolean;
  defaultUserRole: 'user' | 'moderator' | 'admin';
  maxFileUploadSize: number;
  requireEmailVerification: boolean;
}

export interface NotificationSettings {
  adminNotifications: boolean;
  userWelcomeEmail: boolean;
  systemAlerts: boolean;
  weeklyReports: boolean;
}

// ============================================
// MODAL PROPS TYPES
// ============================================

export interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface UserCreateModalProps extends BaseModalProps {
  onCreateUser: (userData: NewUserData) => Promise<void>;
}

export interface UserEditModalProps extends BaseModalProps {
  user: UserProfile;
  onUpdateUser: (user: UserProfile) => Promise<void>;
}

export interface UserDeleteModalProps extends BaseModalProps {
  user: UserProfile;
  onDeleteUser: () => Promise<void>;
}

export interface BulkActionsModalProps extends BaseModalProps {
  selectedCount: number;
  onBulkActivate: () => Promise<void>;
  onBulkDeactivate: () => Promise<void>;
  onBulkDelete: () => Promise<void>;
}

export interface ExportModalProps extends BaseModalProps {
  totalUsers: number;
  onExport: (format: ExportFormat) => void;
}

export interface AnalyticsModalProps extends BaseModalProps {
  stats: UserStats;
  users: UserProfile[];
  onOpenExport: () => void;
}

// ============================================
// PANEL PROPS TYPES
// ============================================

export interface SystemInfoPanelProps {
  systemInfo: SystemInfo;
  onRefresh: () => void;
  onTestEmail: () => void;
}

export interface SecuritySettingsPanelProps {
  settings: SecuritySettings;
  onChange: (settings: SecuritySettings) => void;
  onSave: () => Promise<void>;
  onReset: () => void;
  isSaving: boolean;
}

export interface AppSettingsPanelProps {
  settings: AppSettings;
  onChange: (settings: AppSettings) => void;
  onSave: () => Promise<void>;
  onReset: () => void;
  isSaving: boolean;
}

export interface NotificationSettingsPanelProps {
  settings: NotificationSettings;
  onChange: (settings: NotificationSettings) => void;
  onSave: () => Promise<void>;
  onReset: () => void;
  isSaving: boolean;
}
