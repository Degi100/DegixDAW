# Migration 007: Soft Delete für message_attachments

**Problem:** Wenn User A eine empfangene Datei löscht, wird sie auch für User B (Sender) gelöscht.

**Lösung:** Soft Delete mit `deleted_for` Array - jeder User kann "für sich" löschen (wie WhatsApp).

---

## Konzept

**Vorher (Hard Delete):**
```
User A sendet Datei → User B
User B löscht Datei
→ Datei weg für BEIDE (User A + User B)
```

**Nachher (Soft Delete):**
```
User A sendet Datei → User B
User B löscht "für mich"
→ Datei weg für User B
→ Datei NOCH DA für User A
```

**Cleanup:**
```
User A löscht auch "für mich"
→ Beide User haben gelöscht
→ Datei wird WIRKLICH gelöscht (Cleanup-Job)
```

---

## Schritt 1: Migration ausführen

1. Öffne **Supabase Dashboard** → **SQL Editor**
2. Erstelle neues Query
3. Kopiere den Inhalt von [`007_soft_delete_attachments.sql`](./007_soft_delete_attachments.sql)
4. Führe aus (Run)

---

## Schritt 2: Frontend anpassen

Die Delete-Logik muss angepasst werden:

**Vorher:**
```typescript
await supabase
  .from('message_attachments')
  .delete()
  .eq('id', fileId);
```

**Nachher:**
```typescript
await supabase.rpc('soft_delete_attachment', {
  p_attachment_id: fileId
});
```

---

## Was ändert sich?

### Datenbank:
- ✅ Neue Spalte: `deleted_for UUID[]` (Array von User-IDs)
- ✅ Neue RLS Policy: Filtert Dateien wo `auth.uid() IN deleted_for`
- ✅ Neue Funktion: `soft_delete_attachment(attachment_id)`
- ✅ Cleanup Funktion: `cleanup_fully_deleted_attachments()` (optional)

### Frontend:
- ✅ DELETE → RPC Call `soft_delete_attachment`
- ✅ Realtime Update entfernt Datei aus Liste
- ✅ Storage-Files bleiben erhalten (bis Hard Delete)

### User Experience:
- User A hochlädt Datei → Sichtbar für User A + User B
- User B löscht → Weg für User B, noch da für User A
- User A löscht → Weg für beide → Cleanup-Job löscht wirklich

---

## Verification

```sql
-- Check column was added
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'message_attachments'
  AND column_name = 'deleted_for';

-- Check policies
SELECT policyname, cmd
FROM pg_policies
WHERE tablename = 'message_attachments';

-- Test soft delete (nach Frontend-Update)
SELECT * FROM message_attachments WHERE id = 'test-id';
SELECT soft_delete_attachment('test-id');
SELECT * FROM message_attachments WHERE id = 'test-id'; -- Sollte leer sein für dich
```

---

## Cleanup Job (optional)

Später kannst du einen Cronjob einrichten der `cleanup_fully_deleted_attachments()` aufruft:

```sql
-- Manuell ausführen:
SELECT cleanup_fully_deleted_attachments();

-- Oder mit pg_cron (optional):
SELECT cron.schedule(
  'cleanup-deleted-attachments',
  '0 2 * * *', -- Jeden Tag um 2 Uhr nachts
  'SELECT cleanup_fully_deleted_attachments()'
);
```

---

## Rollback (falls nötig)

```sql
-- Remove column
ALTER TABLE message_attachments DROP COLUMN deleted_for;

-- Drop index
DROP INDEX IF EXISTS idx_message_attachments_deleted_for;

-- Drop functions
DROP FUNCTION IF EXISTS soft_delete_attachment(UUID);
DROP FUNCTION IF EXISTS cleanup_fully_deleted_attachments();

-- Restore old policies (from Migration 005)
-- See 005_message_attachments_rls.sql
```

---

## Status

- ⏳ **Not executed yet**
- Nach Ausführung: Frontend Code muss angepasst werden
- Dann: Update dieses File mit ✅
