/**
 * Analytics Service Types
 * TypeScript interfaces for Analytics Dashboard
 */

// ============================================================================
// Storage Types
// ============================================================================

export interface TableSize {
  name: string;
  size_mb: number;
  percentage: number;
}

export interface BucketSize {
  name: string;
  size_mb: number;
  files_count: number;
  percentage: number;
}

export interface StorageStats {
  database: {
    total_mb: number;
    tables: TableSize[];
    largest_table?: TableSize;
    smallest_table?: TableSize;
  };
  storage: {
    total_mb: number;
    buckets: BucketSize[];
    largest_bucket?: BucketSize;
  };
  total_mb: number;
  quota_gb: number;
  quota_used_percent: number;
}

// ============================================================================
// Metrics Types
// ============================================================================

export interface UserMetrics {
  total: number;
  active: number;        // Last 7 days
  admins: number;
  moderators: number;
  beta_users: number;
  regular_users: number; // Calculated: total - special roles
}

export interface MessageMetrics {
  total: number;
  today: number;
  conversations: number;
}

export interface IssueMetrics {
  total: number;
  open: number;
  closed: number;
  in_progress: number;
}

export interface CodeMetrics {
  loc: number;           // Lines of Code
  files: number;
  commits: number;
  projectAge: {
    days: number;
    startDate: string;   // YYYY-MM-DD
  };
}

export interface ProjectMetrics {
  users: UserMetrics;
  messages: MessageMetrics;
  issues: IssueMetrics;
  code: CodeMetrics;
}

// ============================================================================
// Milestones Types
// ============================================================================

export type MilestoneCategory = 'feature' | 'release' | 'code' | 'users' | 'milestone';

export interface Milestone {
  id: string;
  date: string;          // YYYY-MM-DD
  title: string;
  icon: string;          // Emoji
  category: MilestoneCategory;
  loc_change?: number;
  commit_hash?: string;
  description?: string;
}

// ============================================================================
// Analytics Dashboard Types
// ============================================================================

export interface AnalyticsData {
  metrics: ProjectMetrics | null;
  storage: StorageStats | null;
  loading: boolean;
  error: string | null;
}

// ============================================================================
// Stats Card Types (UI)
// ============================================================================

export interface StatCardData {
  label: string;
  value: number | string;
  icon: string;          // Emoji
  trend?: {
    value: number;       // Percentage change
    isPositive: boolean;
  };
  format?: 'number' | 'bytes' | 'percentage';
}
