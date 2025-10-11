# Analytics System - Project Growth Dashboard

**Status:** 🎯 MVP Ready to Implement
**Priority:** ⭐⭐⭐ HIGH
**Estimated Time:** 4-6 hours
**Branch:** `feature/project-analytics-dashboard`

---

## 🎯 Vision

Ein **Single-Page Admin-Dashboard** unter `/admin/analytics`, das auf **einen Blick** zeigt:
- 📊 Wo steht das Projekt? (Stats)
- 📈 Wie ist es gewachsen? (Timeline)
- 🎯 Was waren die Highlights? (Milestones)
- 💾 Wie viel Speicher wird genutzt? (Storage)

---

## 📦 MVP Features (v1.0)

### ✅ Must-Have Components

#### 1. **Stats Overview Cards** (7 KPIs)
```
┌──────────────────────────────────────────────────────────────┐
│  📊 Project Overview                   Since: 24 Sept 2025   │
├──────────────────────────────────────────────────────────────┤
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│  │ 👥 Users │ │ 💬 Msgs  │ │ 🐛 Issues│ │ 📝 LOC   │        │
│  │   24     │ │  1,234   │ │   89     │ │  48.5K   │        │
│  │  +15% ↗  │ │  +22% ↗  │ │  -5% ↘   │ │  +8% ↗   │        │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘        │
│                                                               │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                     │
│  │ 💾 DB    │ │ 📦 Storage│ │ 📡 Total │                     │
│  │  52.3 MB │ │  12.5 MB │ │  64.8 MB │                     │
│  │  +8% ↗   │ │  +25% ↗  │ │  +10% ↗  │                     │
│  └──────────┘ └──────────┘ └──────────┘                     │
└──────────────────────────────────────────────────────────────┘
```

**Metriken:**
- **Users**: `SELECT COUNT(*) FROM profiles`
- **Messages**: `SELECT COUNT(*) FROM messages`
- **Issues**: `SELECT COUNT(*) FROM issues WHERE status != 'closed'`
- **LOC**: Lines of Code (Git-basiert, gecacht)
- **Database Size**: Supabase RPC `get_database_size()`
- **Storage Size**: Supabase Storage API (Buckets: avatars, attachments, files)
- **Total Size**: DB + Storage

**Trends:**
- % Change: Week-over-Week Vergleich
- Color: Green ↗ (positiv), Red ↘ (negativ)

---

#### 2. **Growth Timeline Chart** (Multi-Metrik)
```
┌─────────────────────────────────────────────────────────────┐
│  📈 Growth Timeline (Last 30 Days)                          │
├─────────────────────────────────────────────────────────────┤
│  [Toggle: ☑ LOC  ☑ Users  ☑ Messages  ☑ Storage]          │
│                                                              │
│  50K ┤                                        ●             │
│      │                                   ╱────              │
│  40K ┤                              ╱────                   │
│      │                         ╱────                        │
│  30K ┤                    ╱────                             │
│      │               ╱────   ● ← Issues System              │
│  20K ┤          ╱────                                       │
│      │     ╱────● ← Feature-Flags                           │
│  10K ┤╱────                                                 │
│      └──────┴──────┴──────┴──────┴──────┴──────→           │
│       24.Sep  27.Sep  1.Okt  5.Okt  8.Okt  10.Okt          │
│                                                              │
│  Legend: ━━ LOC   ━━ Users   ━━ Messages   ━━ Storage      │
└─────────────────────────────────────────────────────────────┘
```

**Features:**
- ✅ Multi-Line Chart (Recharts)
- ✅ Toggleable Metrics (User wählt was angezeigt wird)
- ✅ Event-Markers (Dots für Meilensteine)
- ✅ Hover-Tooltip mit Details:
  ```
  ┌──────────────────────────────┐
  │ 📅 8. Oktober 2025           │
  │ 🚀 Issues System Launch      │
  │                              │
  │ 📊 Project Stats:            │
  │   • LOC: 42.5K (+1.8K)       │
  │   • Users: 18 (+2)           │
  │   • Messages: 1.1K (+234)    │
  │   • Storage: 58 MB (+5 MB)   │
  │                              │
  │ 🔗 Commit: 4d750d8           │
  └──────────────────────────────┘
  ```

**Tech Stack:**
- [Recharts](https://recharts.org/) (empfohlen)
- Responsive + Dark-Mode-Support

---

#### 3. **Recent Milestones Timeline**
```
┌─────────────────────────────────────────────────────────────┐
│  🎯 Major Milestones                                        │
├─────────────────────────────────────────────────────────────┤
│  ● 10.Okt  🎤 Speech-to-Text System     +2.3K LOC          │
│  ● 8.Okt   🐛 Issues System Launch      +1.8K LOC          │
│  ● 7.Okt   🚀 Feature-Flags Backend     +2.3K LOC          │
│  ● 28.Sept 💬 Chat System v2            +5.1K LOC          │
│  ● 25.Sept 🔧 Big Refactoring           +3.5K LOC          │
│  ● 24.Sept 🎉 Initial Commit            Project Start      │
└─────────────────────────────────────────────────────────────┘
```

**Datenquelle (MVP):**
- JSON-Datei: `src/lib/constants/milestones.ts`
- Format:
  ```typescript
  export const milestones = [
    {
      id: '1',
      date: '2025-10-10',
      title: 'Speech-to-Text System',
      icon: '🎤',
      category: 'feature',
      loc_change: 2300,
      commit_hash: 'd1c3bc9'
    },
    // ...
  ];
  ```

**Später (v2.0):**
- DB-Tabelle: `milestones` (Admin kann manuell hinzufügen)

---

#### 4. **Storage Breakdown**
```
┌─────────────────────────────────────────────────────────────┐
│  💾 Storage Breakdown                                        │
├─────────────────────────────────────────────────────────────┤
│  Database (52.3 MB)                                          │
│  ┌────────────────────────────────────────────────────┐     │
│  │  ██████████████████░░░░░░ 65%  messages (34 MB)   │     │
│  │  ███████░░░░░░░░░░░░░░░░░ 18%  profiles (9.4 MB)  │     │
│  │  ████░░░░░░░░░░░░░░░░░░░░ 10%  issues (5.2 MB)    │     │
│  │  ██░░░░░░░░░░░░░░░░░░░░░░  7%  other (3.7 MB)     │     │
│  └────────────────────────────────────────────────────┘     │
│                                                              │
│  Storage Buckets (12.5 MB)                                   │
│  ┌────────────────────────────────────────────────────┐     │
│  │  ███████████████░░░░░░░░░ 60%  avatars (7.5 MB)   │     │
│  │  ██████████░░░░░░░░░░░░░░ 35%  attachments (4.4MB)│     │
│  │  █░░░░░░░░░░░░░░░░░░░░░░░  5%  project-files (0.6)│     │
│  └────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

**Datenquellen:**
- Database: Supabase RPC `get_table_sizes()`
- Storage: Supabase Storage API `storage.from('bucket').list()`

---

#### 5. **Quick Stats Grid**
```
┌───────────────────────────────────────────────────────────┐
│  📊 Detailed Stats                                         │
├───────────────────────────────────────────────────────────┤
│  Code                 Users                 Activity       │
│  • 232 Files         • 5 Admins            • 23 Active    │
│  • 154 Commits       • 3 Moderators        • 1.2K Msgs/d  │
│  • 16 Days old       • 16 Beta Users       • 12 Issues/w  │
└───────────────────────────────────────────────────────────┘
```

---

## 🗄️ Database Schema

### **New Tables (v2.0 - Optional für MVP)**

```sql
-- Historische Metriken-Snapshots (für Timeline-Chart)
create table project_snapshots (
  id uuid primary key default gen_random_uuid(),
  snapshot_date date not null unique,

  -- Code Metrics
  total_loc bigint not null,
  total_files int not null,
  total_commits int not null,

  -- User Metrics
  total_users int not null,
  active_users int not null,

  -- Chat Metrics
  total_messages bigint not null,
  total_conversations int not null,

  -- Issue Metrics
  total_issues int not null,
  open_issues int not null,
  closed_issues int not null,

  -- Storage Metrics
  database_size_mb numeric(10,2) not null,
  storage_size_mb numeric(10,2) not null,

  -- Git Event
  git_commit_hash text,
  git_commit_message text,

  created_at timestamptz default now()
);

create index idx_snapshots_date on project_snapshots(snapshot_date desc);

-- Meilensteine (manuell + auto-generiert)
create table milestones (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  milestone_type text not null, -- 'auto', 'manual'
  category text not null, -- 'users', 'features', 'issues', 'release', 'code'
  icon text, -- Emoji
  achieved_at timestamptz not null,

  -- Metrics Snapshot
  metadata jsonb, -- { loc_change: 2300, users_at_time: 18, commit_hash: '...' }

  -- Admin
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

create index idx_milestones_date on milestones(achieved_at desc);
```

---

### **New RPC Functions (Required für MVP)**

```sql
-- scripts/sql/analytics_storage_functions.sql

-- Get Database Size
CREATE OR REPLACE FUNCTION get_database_size()
RETURNS bigint
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT pg_database_size(current_database());
$$;

-- Get Table Sizes
CREATE OR REPLACE FUNCTION get_table_sizes()
RETURNS TABLE (
  tablename text,
  size_bytes bigint
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    tablename::text,
    pg_total_relation_size(schemaname||'.'||tablename) AS size_bytes
  FROM pg_tables
  WHERE schemaname = 'public'
  ORDER BY size_bytes DESC;
$$;

-- Grant Execute Permissions (nur für Admins)
GRANT EXECUTE ON FUNCTION get_database_size() TO authenticated;
GRANT EXECUTE ON FUNCTION get_table_sizes() TO authenticated;

-- RLS Policy (nur Admins dürfen abrufen)
-- Wird im Frontend via useAdmin() geprüft
```

---

## 🔧 Implementation Plan

### **File Structure**

```
src/
├── lib/
│   ├── services/
│   │   └── analytics/
│   │       ├── storageService.ts      # Supabase Storage APIs
│   │       ├── metricsService.ts      # Stats Queries
│   │       ├── snapshotsService.ts    # Historical Data (v2.0)
│   │       ├── helpers.ts             # Calculations
│   │       └── types.ts               # TypeScript Interfaces
│   └── constants/
│       └── milestones.ts              # Hardcoded Milestones (MVP)
├── hooks/
│   └── useAnalytics.ts                # Main Hook
├── pages/
│   └── admin/
│       └── AdminAnalytics.tsx         # Main Page
└── components/
    └── admin/
        └── analytics/
            ├── StatsCard.tsx          # Single KPI Card
            ├── StatsGrid.tsx          # 7-Card Grid
            ├── GrowthChart.tsx        # Recharts Timeline
            ├── MilestonesList.tsx     # Timeline List
            └── StorageBreakdown.tsx   # Bar Charts
```

---

### **Service Layer**

#### **`src/lib/services/analytics/storageService.ts`**

```typescript
import { supabase } from '../../supabase';

export interface StorageStats {
  database: {
    total_mb: number;
    tables: {
      name: string;
      size_mb: number;
      percentage: number;
    }[];
  };
  storage: {
    total_mb: number;
    buckets: {
      name: string;
      size_mb: number;
      files_count: number;
      percentage: number;
    }[];
  };
  total_mb: number;
}

/**
 * Get Database Size in MB
 */
export async function getDatabaseSize(): Promise<number> {
  const { data, error } = await supabase.rpc('get_database_size');
  if (error) throw error;
  return data / (1024 * 1024); // bytes → MB
}

/**
 * Get Table Sizes
 */
export async function getTableSizes(): Promise<Array<{ name: string; size_mb: number }>> {
  const { data, error } = await supabase.rpc('get_table_sizes');
  if (error) throw error;

  return data.map((table: any) => ({
    name: table.tablename,
    size_mb: table.size_bytes / (1024 * 1024)
  }));
}

/**
 * Get Storage Bucket Size
 */
export async function getBucketSize(bucketName: string): Promise<{ size_mb: number; files: number }> {
  const { data: files, error } = await supabase
    .storage
    .from(bucketName)
    .list('', { limit: 1000 }); // TODO: Pagination for >1000 files

  if (error) throw error;

  const totalBytes = files.reduce((sum, file) => sum + (file.metadata?.size || 0), 0);

  return {
    size_mb: totalBytes / (1024 * 1024),
    files: files.length
  };
}

/**
 * Get Complete Storage Stats
 */
export async function getStorageStats(): Promise<StorageStats> {
  const dbSize = await getDatabaseSize();
  const tables = await getTableSizes();

  const buckets = ['avatars', 'attachments', 'project-files'];
  const bucketStats = await Promise.all(
    buckets.map(async (name) => {
      try {
        const { size_mb, files } = await getBucketSize(name);
        return { name, size_mb, files_count: files, percentage: 0 };
      } catch (error) {
        console.warn(`Bucket ${name} not accessible:`, error);
        return { name, size_mb: 0, files_count: 0, percentage: 0 };
      }
    })
  );

  const storageTotal = bucketStats.reduce((sum, b) => sum + b.size_mb, 0);

  // Calculate percentages
  bucketStats.forEach(b => {
    b.percentage = storageTotal > 0 ? (b.size_mb / storageTotal) * 100 : 0;
  });

  tables.forEach(t => {
    (t as any).percentage = dbSize > 0 ? (t.size_mb / dbSize) * 100 : 0;
  });

  return {
    database: {
      total_mb: dbSize,
      tables: tables.map(t => ({ ...t, percentage: (t as any).percentage }))
    },
    storage: {
      total_mb: storageTotal,
      buckets: bucketStats
    },
    total_mb: dbSize + storageTotal
  };
}
```

---

#### **`src/lib/services/analytics/metricsService.ts`**

```typescript
import { supabase } from '../../supabase';

export interface ProjectMetrics {
  users: {
    total: number;
    active: number; // Last 7 days
    admins: number;
    moderators: number;
    beta_users: number;
  };
  messages: {
    total: number;
    today: number;
    conversations: number;
  };
  issues: {
    total: number;
    open: number;
    closed: number;
    in_progress: number;
  };
  code: {
    loc: number; // Lines of Code (cached)
    files: number;
    commits: number;
  };
}

/**
 * Get User Metrics
 */
export async function getUserMetrics() {
  // Total Users
  const { count: total } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true });

  // Active Users (Last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { count: active } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .gte('last_seen_at', sevenDaysAgo.toISOString());

  // Roles
  const { data: roles } = await supabase
    .from('profiles')
    .select('role');

  const admins = roles?.filter(r => r.role === 'admin').length || 0;
  const moderators = roles?.filter(r => r.role === 'moderator').length || 0;
  const beta_users = roles?.filter(r => r.role === 'beta_user').length || 0;

  return {
    total: total || 0,
    active: active || 0,
    admins,
    moderators,
    beta_users
  };
}

/**
 * Get Message Metrics
 */
export async function getMessageMetrics() {
  // Total Messages
  const { count: total } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true });

  // Messages Today
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { count: todayCount } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', today.toISOString());

  // Conversations
  const { count: conversations } = await supabase
    .from('conversations')
    .select('*', { count: 'exact', head: true });

  return {
    total: total || 0,
    today: todayCount || 0,
    conversations: conversations || 0
  };
}

/**
 * Get Issue Metrics
 */
export async function getIssueMetrics() {
  const { data: issues } = await supabase
    .from('issues')
    .select('status');

  return {
    total: issues?.length || 0,
    open: issues?.filter(i => i.status === 'open').length || 0,
    closed: issues?.filter(i => i.status === 'closed').length || 0,
    in_progress: issues?.filter(i => i.status === 'in_progress').length || 0
  };
}

/**
 * Get All Project Metrics
 */
export async function getProjectMetrics(): Promise<ProjectMetrics> {
  const [users, messages, issues] = await Promise.all([
    getUserMetrics(),
    getMessageMetrics(),
    getIssueMetrics()
  ]);

  // Code metrics (placeholder - implement LOC tracking separately)
  const code = {
    loc: 48500, // TODO: Implement Git-based tracking
    files: 232,
    commits: 154
  };

  return {
    users,
    messages,
    issues,
    code
  };
}
```

---

#### **`src/lib/constants/milestones.ts`** (MVP)

```typescript
export interface Milestone {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  icon: string; // Emoji
  category: 'feature' | 'release' | 'code' | 'users' | 'milestone';
  loc_change?: number;
  commit_hash?: string;
  description?: string;
}

export const milestones: Milestone[] = [
  {
    id: '10',
    date: '2025-10-10',
    title: 'Speech-to-Text System',
    icon: '🎤',
    category: 'feature',
    loc_change: 2300,
    commit_hash: 'd1c3bc9',
    description: 'Admin Issues können jetzt via Spracheingabe erstellt werden'
  },
  {
    id: '9',
    date: '2025-10-10',
    title: 'RoleBadge Component',
    icon: '🎨',
    category: 'feature',
    loc_change: 312,
    commit_hash: '4be2252'
  },
  {
    id: '8',
    date: '2025-10-10',
    title: 'Comments System',
    icon: '💬',
    category: 'feature',
    loc_change: 574,
    commit_hash: '2c04d25'
  },
  {
    id: '7',
    date: '2025-10-10',
    title: 'Claude ↔ Issues Integration',
    icon: '🤖',
    category: 'feature',
    loc_change: 809,
    commit_hash: '4d750d8',
    description: 'Auto-Status + Lock-System für Issues'
  },
  {
    id: '6',
    date: '2025-10-09',
    title: 'Granulare Admin Route Permissions',
    icon: '🔐',
    category: 'feature',
    loc_change: 528,
    commit_hash: '55d84c9'
  },
  {
    id: '5',
    date: '2025-10-09',
    title: 'Issues System Launch',
    icon: '🐛',
    category: 'feature',
    loc_change: 1857,
    commit_hash: 'd315e36',
    description: 'Vollständiges Issue-Tracking mit Assignment + Comments'
  },
  {
    id: '4',
    date: '2025-10-09',
    title: 'Beta-User Role',
    icon: '🧪',
    category: 'feature',
    loc_change: 163,
    commit_hash: '6daeb78'
  },
  {
    id: '3',
    date: '2025-10-08',
    title: 'Admin Role-Management System',
    icon: '👑',
    category: 'feature',
    loc_change: 489,
    commit_hash: '95a2249',
    description: 'Super-Admin Protection + Bulk Operations'
  },
  {
    id: '2',
    date: '2025-10-08',
    title: 'Release v0.1.3',
    icon: '🔖',
    category: 'release',
    commit_hash: '2c04d25'
  },
  {
    id: '1',
    date: '2025-09-24',
    title: 'Initial Commit',
    icon: '🎉',
    category: 'milestone',
    description: 'Projektstart - DegixDAW Frontend'
  }
];
```

---

### **React Hook**

#### **`src/hooks/useAnalytics.ts`**

```typescript
import { useState, useEffect } from 'react';
import { getProjectMetrics, type ProjectMetrics } from '../lib/services/analytics/metricsService';
import { getStorageStats, type StorageStats } from '../lib/services/analytics/storageService';

interface AnalyticsData {
  metrics: ProjectMetrics | null;
  storage: StorageStats | null;
  loading: boolean;
  error: string | null;
}

export function useAnalytics() {
  const [data, setData] = useState<AnalyticsData>({
    metrics: null,
    storage: null,
    loading: true,
    error: null
  });

  const loadAnalytics = async () => {
    try {
      setData(prev => ({ ...prev, loading: true, error: null }));

      const [metrics, storage] = await Promise.all([
        getProjectMetrics(),
        getStorageStats()
      ]);

      setData({
        metrics,
        storage,
        loading: false,
        error: null
      });
    } catch (error) {
      console.error('Failed to load analytics:', error);
      setData(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load analytics'
      }));
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  return {
    ...data,
    refresh: loadAnalytics
  };
}
```

---

## 🚀 Implementation Steps

### **Phase 1: Backend Setup (30 min)**
1. ✅ SQL Script erstellen: `scripts/sql/analytics_storage_functions.sql`
2. ✅ RPC Functions in Supabase deployen: `npm run db:sql analytics_storage_functions`
3. ✅ Testen via Supabase SQL Editor

### **Phase 2: Service Layer (1h)**
1. ✅ `storageService.ts` implementieren
2. ✅ `metricsService.ts` implementieren
3. ✅ `milestones.ts` erstellen
4. ✅ `useAnalytics.ts` Hook erstellen

### **Phase 3: UI Components (2h)**
1. ✅ `StatsCard.tsx` - Einzelne KPI-Card
2. ✅ `StatsGrid.tsx` - 7-Card-Layout
3. ✅ `MilestonesList.tsx` - Timeline-Liste
4. ✅ `StorageBreakdown.tsx` - Bar-Charts

### **Phase 4: Chart Integration (1h)**
1. ✅ Recharts installieren: `npm install recharts`
2. ✅ `GrowthChart.tsx` - Multi-Line-Chart mit Toggle
3. ✅ Hover-Tooltips konfigurieren

### **Phase 5: Page Assembly (30 min)**
1. ✅ `AdminAnalytics.tsx` - Alle Components zusammenbauen
2. ✅ Route in `main.tsx` registrieren
3. ✅ Admin-Menu-Link hinzufügen

### **Phase 6: Styling (30 min)**
1. ✅ SCSS für Analytics-Components
2. ✅ Dark-Mode Support
3. ✅ Responsive Layout

### **Phase 7: Testing (30 min)**
1. ✅ Admin-Zugriff prüfen
2. ✅ Storage-Queries testen
3. ✅ Chart-Interaktion testen

---

## 📈 Future Enhancements (v2.0+)

### **Advanced Features (Later)**
- ⏰ **Tägliche Snapshots**: Supabase Edge Function (Cron) speichert Metriken täglich
- 📊 **Historical Timeline**: Chart zeigt echte historische Daten (aus `project_snapshots`)
- 🔮 **Predictions**: "At this rate: 100 Users by 1. Nov"
- 🔥 **Activity Heatmap**: Peak-Tage für Chat/Issues
- 📤 **Export**: CSV/JSON Download
- 🎯 **Custom Milestones**: Admin kann manuell Milestones hinzufügen
- 📡 **Realtime Updates**: Stats refreshen live via Supabase Subscriptions
- 🌐 **Git Integration**: Webhook bei Push → Stats updaten
- 📊 **Comparison Views**: This week vs last week
- 🎨 **LOC-Tracking**: Git-basiert, historisch rückwirkend generierbar

---

## 🎨 Design Notes

### **Color Scheme (Corporate Dark)**
```scss
// Stats Cards
--card-bg: var(--surface-secondary);
--card-border: var(--border-color);
--stat-positive: #22c55e; // Green
--stat-negative: #ef4444; // Red

// Chart
--chart-line-1: #3b82f6; // Blue (LOC)
--chart-line-2: #8b5cf6; // Purple (Users)
--chart-line-3: #06b6d4; // Cyan (Messages)
--chart-line-4: #f59e0b; // Orange (Storage)
--chart-grid: rgba(255, 255, 255, 0.1);
```

### **Icons**
- Stats Cards: Emoji (👥💬🐛📝💾📦📡)
- Milestones: Emoji (🎤🐛🚀💬🔧🎉)
- Trends: Unicode Arrows (↗↘)

---

## 🛠️ Dependencies

**New:**
```json
{
  "recharts": "^2.10.0"
}
```

**Install:**
```bash
npm install recharts
```

---

## 🔒 Security

- ✅ Admin-only Route: `<AdminRoute>` Component
- ✅ RPC Functions: `SECURITY DEFINER` (nur Admins via Frontend-Check)
- ✅ Storage Queries: RLS Policies apply (nur eigene Buckets)

---

## 📝 Notes

- **LOC Tracking**: Für MVP hardcoded, später Git-basiert via Script
- **Historical Data**: MVP zeigt Live-Stats, v2.0 mit historischen Charts
- **Performance**: Alle Queries parallel (Promise.all), ~2-3s Ladezeit
- **Refresh**: Manueller Button, später Auto-Refresh alle 5 Min

---

## ✅ Checklist für Implementation

- [ ] SQL Functions deployen
- [ ] Service Layer implementieren
- [ ] Milestones JSON erstellen
- [ ] Stats Cards bauen
- [ ] Recharts installieren + Chart bauen
- [ ] Milestones List bauen
- [ ] Storage Breakdown bauen
- [ ] Main Page zusammenbauen
- [ ] Route registrieren + Menu-Link
- [ ] SCSS Styling
- [ ] Testing

---

**🔥 LET'S BUILD THIS! 🚀**