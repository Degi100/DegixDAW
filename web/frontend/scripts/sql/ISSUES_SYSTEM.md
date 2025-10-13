

# 📋 Issues System - Supabase Integration

Vollständiges Issue-Tracking-System mit Assignment, Labels, Comments, PR-Integration und Realtime-Updates.

## 🎯 Features

### Core Features
- ✅ **CRUD Operations** - Create, Read, Update, Delete Issues
- ✅ **Assignment System** - Lock-Mechanismus verhindert Doppel-Assignments
- ✅ **Priority & Status** - Critical/High/Medium/Low + Open/In Progress/Done/Closed
- ✅ **Labels/Tags** - Kategorisierung via Labels (bug, feature, urgent, etc.)
- ✅ **Comments** - Separate Tabelle für Issue-Diskussionen
- ✅ **Realtime Updates** - Live-Sync via Supabase Subscriptions
- ✅ **PR-Integration** - metadata.pr_url für GitHub-Links
- ✅ **RLS Policies** - Admin/Moderator-only Zugriff

### Advanced Features
- 🔒 **Assignment Lock** - Issue wird gesperrt wenn assigned
- 💬 **Automatic Comments** - Status/Assignment-Changes erzeugen Auto-Comments
- 📊 **Statistics** - Real-time Issue-Stats (open, in_progress, done, etc.)
- 🔍 **Filtering & Sorting** - Client-side Filtering nach Status, Priority, Labels
- 👥 **Multi-User** - Realtime-Sync zwischen Admin/Moderator

## 🚀 Setup

### 1. Supabase SQL ausführen

```bash
# Script anzeigen
npm run db:show scripts/sql/issues_system_setup.sql

# Öffne Supabase SQL-Editor
# https://supabase.com/dashboard/project/YOUR_PROJECT/sql

# Kopiere Script-Inhalt, klicke "Run" ✅
```

Das erstellt:
- ✅ `issues` Tabelle
- ✅ `issue_comments` Tabelle
- ✅ RPC Functions (`get_issues_with_details`, `assign_issue`)
- ✅ Triggers (auto-update timestamps, completed_at)
- ✅ RLS Policies (Admin/Mod only)
- ✅ Realtime aktiviert

### 2. Frontend-Integration

Das System ist bereits integriert:

```typescript
// Hook verwenden
import { useIssues } from './hooks/useIssues';
import { useIssueComments } from './hooks/useIssueComments';

// Issues laden
const { issues, loading, createIssue, assignIssue } = useIssues();

// Comments laden
const { comments, addComment } = useIssueComments(issueId);
```

## 📊 Datenbank-Schema

### `issues` Tabelle

| Spalte | Typ | Beschreibung |
|--------|-----|--------------|
| `id` | UUID | Primary Key |
| `title` | TEXT | Issue-Titel (required) |
| `description` | TEXT | Detaillierte Beschreibung |
| `status` | TEXT | `open`, `in_progress`, `done`, `closed` |
| `priority` | TEXT | `low`, `medium`, `high`, `critical` |
| `category` | TEXT | Freie Kategorisierung |
| `labels` | TEXT[] | Array von Labels |
| `assigned_to` | UUID | FK → profiles.id (Lock-System) |
| `created_by` | UUID | FK → profiles.id |
| `created_at` | TIMESTAMPTZ | Auto-Timestamp |
| `updated_at` | TIMESTAMPTZ | Auto-Update via Trigger |
| `completed_at` | TIMESTAMPTZ | Auto-Set wenn status = 'done' |
| `metadata` | JSONB | Flexibel (z.B. pr_url) |

### `issue_comments` Tabelle

| Spalte | Typ | Beschreibung |
|--------|-----|--------------|
| `id` | UUID | Primary Key |
| `issue_id` | UUID | FK → issues.id (CASCADE DELETE) |
| `user_id` | UUID | FK → profiles.id |
| `comment` | TEXT | Kommentar-Text |
| `action_type` | TEXT | `comment`, `status_change`, `assignment`, `label_change` |
| `created_at` | TIMESTAMPTZ | Auto-Timestamp |
| `metadata` | JSONB | Flexibel (z.B. old_status, new_status) |

## 🔐 RLS Policies

### Issues Policies

```sql
-- Admin/Moderator können alles sehen
CREATE POLICY "admin_mod_can_view_all_issues"
  ON issues FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'moderator')
    )
  );

-- Admin/Mod können Issues erstellen/updaten/löschen
-- (analog für INSERT, UPDATE, DELETE)
```

### Comments Policies

```sql
-- Admin/Mod können Comments sehen/erstellen
-- User können nur eigene Comments löschen (Admin kann alle löschen)
CREATE POLICY "admin_mod_can_delete_comments"
  ON issue_comments FOR DELETE
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );
```

## 🔄 Assignment-System (Lock-Mechanismus)

### Funktionsweise

1. **Issue ist unassigned** → Jeder Mod/Admin kann zuweisen
2. **Issue ist assigned** → Gesperrt für andere (RPC gibt Fehler zurück)
3. **Unassign** → `assigned_to = NULL` → Lock aufgehoben

### RPC Function

```sql
CREATE OR REPLACE FUNCTION assign_issue(
  issue_id UUID,
  user_id UUID
)
RETURNS JSONB AS $$
DECLARE
  current_assignee UUID;
BEGIN
  SELECT assigned_to INTO current_assignee FROM issues WHERE id = issue_id;

  -- Check if already assigned to someone else
  IF current_assignee IS NOT NULL AND current_assignee != user_id THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Issue is already assigned to another user'
    );
  END IF;

  -- Assign issue + auto-set status to 'in_progress'
  UPDATE issues
  SET assigned_to = user_id, status = 'in_progress'
  WHERE id = issue_id;

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Frontend-Verwendung

```typescript
const { assignIssue } = useIssues();

// Issue zuweisen
const result = await assignIssue(issueId, userId);

if (!result.success) {
  // "Issue is already assigned to another user"
  console.error(result.error);
}

// Issue freigeben
await assignIssue(issueId, null);
```

## 💬 Comments-System

### Automatische Comments

```typescript
import { useIssueComments } from './hooks/useIssueComments';

const { addStatusChangeComment, addAssignmentComment } = useIssueComments(issueId);

// Status-Change-Comment (automatisch)
await addStatusChangeComment('open', 'in_progress', 'Started working on this');

// Assignment-Comment (automatisch)
await addAssignmentComment(null, userId, 'Self-assigned');
```

### Manuelle Comments

```typescript
const { addComment } = useIssueComments(issueId);

await addComment({
  issue_id: issueId,
  comment: 'Found the root cause!',
  action_type: 'comment',
});
```

## 📡 Realtime-Updates

### Issues Subscription

```typescript
// Hook subscribiert automatisch
const { issues } = useIssues();

// Bei INSERT/UPDATE/DELETE → UI aktualisiert sich live
```

### Comments Subscription

```typescript
// Per-Issue Subscription
const { comments } = useIssueComments(issueId);

// Neue Comments erscheinen sofort in allen Sessions
```

## 🎨 UI-Integration

### IssueList-Komponente (Beispiel)

```typescript
import { useIssues } from '../hooks/useIssues';
import { getPriorityEmoji, getStatusEmoji } from '../lib/services/issues';

function IssueList() {
  const { issues, loading, getStats } = useIssues();
  const stats = getStats();

  return (
    <div>
      <h2>Issues ({stats.total})</h2>
      <div>Open: {stats.open} | In Progress: {stats.in_progress}</div>

      {issues.map(issue => (
        <div key={issue.id}>
          <h3>
            {getPriorityEmoji(issue.priority)}
            {getStatusEmoji(issue.status)}
            {issue.title}
          </h3>
          <p>{issue.description}</p>
          {issue.assigned_to_username && (
            <span>🔒 Assigned to: {issue.assigned_to_username}</span>
          )}
        </div>
      ))}
    </div>
  );
}
```

### Comments-Komponente (Beispiel)

```typescript
import { useIssueComments } from '../hooks/useIssueComments';

function IssueComments({ issueId }: { issueId: string }) {
  const { comments, addComment } = useIssueComments(issueId);

  return (
    <div>
      {comments.map(comment => (
        <div key={comment.id}>
          <strong>{comment.user_username}</strong>
          <p>{comment.comment}</p>
          {comment.action_type === 'status_change' && (
            <small>
              Status changed: {comment.metadata.old_status} → {comment.metadata.new_status}
            </small>
          )}
        </div>
      ))}

      <button onClick={() => addComment({ issue_id: issueId, comment: 'Test' })}>
        Add Comment
      </button>
    </div>
  );
}
```

## 🔍 Filtering & Statistics

### Client-Side Filtering

```typescript
const { filterIssues, sortIssues } = useIssues();

// Filter by status + priority
const filtered = filterIssues({
  status: ['open', 'in_progress'],
  priority: ['high', 'critical'],
  search: 'bug',
});

// Sort by priority (critical → high → medium → low)
const sorted = sortIssues(filtered, { field: 'priority', direction: 'desc' });
```

### Statistics

```typescript
const { getStats } = useIssues();
const stats = getStats();

console.log(stats);
// {
//   total: 30,
//   open: 5,
//   in_progress: 3,
//   done: 20,
//   closed: 2,
//   by_priority: { critical: 1, high: 4, medium: 15, low: 10 },
//   by_label: { bug: 12, feature: 8, urgent: 5 },
//   assigned: 10,
//   unassigned: 20
// }
```

## 🛠️ Service Layer

### Service-Struktur

```
src/lib/services/issues/
├── types.ts              # TypeScript Interfaces
├── issuesService.ts      # CRUD + Realtime
├── commentsService.ts    # Comments CRUD
├── helpers.ts            # Filtering, Sorting, Stats
└── index.ts              # Barrel Export
```

### Direct Service Usage (außerhalb Hooks)

```typescript
import {
  getAllIssuesWithDetails,
  createIssue,
  assignIssue,
} from '../lib/services/issues';

// Direct API calls
const { data: issues } = await getAllIssuesWithDetails();
const { data: newIssue } = await createIssue({ title: 'Bug Fix', priority: 'high' });
const { data: result } = await assignIssue(issueId, userId);
```

## 🚨 Troubleshooting

### Issue-Tabelle ist leer (Admin-Panel)

**Problem:** RPC function `get_issues_with_details()` fehlt.

**Lösung:**
```bash
npm run db:show scripts/sql/issues_system_setup.sql
# → In Supabase SQL-Editor einfügen + Run
```

### Realtime funktioniert nicht

**Checken:**
1. Supabase Dashboard → Settings → API → Realtime aktiviert?
2. Browser Console: `[IssuesService] Realtime update` sichtbar?
3. RLS Policies erlauben SELECT für aktuelle User-Role?

### Assignment schlägt fehl (403)

**Problem:** User ist nicht Admin/Moderator.

**Lösung:** Check `profiles.role`:
```sql
SELECT id, username, role FROM profiles WHERE id = auth.uid();
```

### Comments werden nicht gespeichert

**Problem:** RLS Policy blockiert INSERT.

**Lösung:** Check Policy:
```sql
SELECT * FROM pg_policies WHERE tablename = 'issue_comments';
```

## 📝 Export zu ISSUES.md

Der Server-Endpoint `/api/save-markdown` bleibt erhalten für Backup/Export:

```typescript
// AdminIssues.tsx - Export Button
const handleExportMD = async () => {
  const markdown = generateMarkdown(issues);

  await fetch('http://localhost:3001/api/save-markdown', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: markdown, filename: 'ISSUES.md' }),
  });
};
```

**ISSUES.md bleibt als:**
- ✅ Backup-Datei
- ✅ Markdown-Export für Dokumentation
- ✅ Nicht mehr primäre Datenquelle (Supabase ist jetzt Single Source of Truth)

## 🎯 Next Steps

1. **SQL Script ausführen** → `issues_system_setup.sql`
2. **UI Components refactoren** → Assignment, Labels, Comments anzeigen
3. **Testing** → Admin/Mod Permissions, Realtime-Sync
4. **PR-Integration** → metadata.pr_url bei Done-Status setzen
5. **Notifications** → Optional: Bei Status-Change Benachrichtigung senden

---

**System ready! 🚀**
