# Migration 005: message_attachments RLS Policies

**Problem:** Users können ihre Dateien im FileBrowser nicht löschen, weil die `message_attachments` Tabelle keine DELETE Policy hat.

**Lösung:** RLS Policies hinzufügen für SELECT, INSERT, DELETE, UPDATE.

---

## Schritt 1: Migration ausführen

1. Öffne **Supabase Dashboard** → **SQL Editor**
2. Erstelle neues Query
3. Kopiere den Inhalt von [`005_message_attachments_rls.sql`](./005_message_attachments_rls.sql)
4. Führe aus (Run)

---

## Schritt 2: Verification

Führe diese Query aus, um zu prüfen ob die Policies erstellt wurden:

```sql
SELECT
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'message_attachments';
```

**Erwartete Ausgabe:**

| policyname | cmd | qual |
|-----------|-----|------|
| Users can view attachments in their conversations | SELECT | ... |
| Users can insert attachments in their conversations | INSERT | ... |
| Users can delete their own attachments | DELETE | ... |
| Users can update their own attachments | UPDATE | ... |

---

## Schritt 3: Test DELETE

1. Öffne die **DegixDAW Web App**
2. Navigiere zu **Meine Dateien**
3. Klicke auf 🗑️ bei einer Datei
4. Bestätige die Löschung
5. Datei sollte verschwinden

**Console Logs (F12 → Console):**

```
🗑️ Deleting file: { id: "...", fileName: "..." }
✅ Deleted from database
✅ Deleted file from storage
✅ Delete complete - waiting for realtime update...
📡 Realtime event received: DELETE { ... }
```

---

## Troubleshooting

### DELETE schlägt fehl mit "new row violates row-level security policy"

**Grund:** Du versuchst eine Datei zu löschen, die NICHT von dir hochgeladen wurde.

**Check:**

```sql
-- Finde heraus wer die Message gesendet hat
SELECT
  ma.id AS attachment_id,
  ma.file_name,
  m.sender_id,
  p.username AS sender_username,
  auth.uid() AS current_user_id
FROM message_attachments ma
INNER JOIN messages m ON m.id = ma.message_id
LEFT JOIN profiles p ON p.id = m.sender_id
WHERE ma.id = 'deine-file-id';
```

**Lösung:** Falls du ALLE Dateien in deinen Conversations löschen können sollst (nicht nur deine eigenen), nutze die alternative Policy in der Migration (auskommentiert).

### Realtime Update funktioniert nicht

**Grund:** Realtime Subscription ist nicht aktiv.

**Check Console:**

```
📡 Setting up realtime subscription for message_attachments...
📡 Subscription status: SUBSCRIBED
```

Falls `SUBSCRIPTION_ERROR`:

1. Gehe zu Supabase Dashboard → **Database** → **Replication**
2. Stelle sicher dass `message_attachments` in der Publication ist
3. Falls nicht: Add table

---

## Rollback (falls nötig)

```sql
-- Disable RLS
ALTER TABLE message_attachments DISABLE ROW LEVEL SECURITY;

-- Drop policies
DROP POLICY IF EXISTS "Users can view attachments in their conversations" ON message_attachments;
DROP POLICY IF EXISTS "Users can insert attachments in their conversations" ON message_attachments;
DROP POLICY IF EXISTS "Users can delete their own attachments" ON message_attachments;
DROP POLICY IF EXISTS "Users can update their own attachments" ON message_attachments;
```

---

## Status

- ⏳ **Not executed yet** - Warte auf User zum Ausführen
- Nach Ausführung: Update dieses File mit ✅
