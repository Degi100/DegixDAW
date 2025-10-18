# Migration 006: Fix DELETE Policy für empfangene Dateien

**Problem:** User können nur Dateien löschen die sie selbst hochgeladen haben, aber nicht empfangene Dateien.

**Grund:** Die DELETE Policy prüft nur `sender_id = auth.uid()`, sollte aber `conversation_member` prüfen.

**Lösung:** Erweitere DELETE Policy auf ALLE Attachments in User's Conversations.

---

## Schritt 1: Migration ausführen

1. Öffne **Supabase Dashboard** → **SQL Editor**
2. Erstelle neues Query
3. Kopiere den Inhalt von [`006_message_attachments_delete_fix.sql`](./006_message_attachments_delete_fix.sql)
4. Führe aus (Run)

---

## Schritt 2: Verification

Führe diese Query aus:

```sql
SELECT
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'message_attachments'
  AND cmd = 'DELETE';
```

**Erwartete Ausgabe:**

| policyname | cmd | qual |
|-----------|-----|------|
| Users can delete attachments in their conversations | DELETE | (message_id IN ...) |

---

## Schritt 3: Test

1. Öffne **DegixDAW Web App**
2. Gehe zu **Empfangen** Tab
3. Klicke auf 🗑️ bei einer empfangenen Datei
4. Sollte jetzt funktionieren! ✅

---

## Was ändert sich?

### Vorher (restriktiv):
```sql
-- Nur Dateien von Messages die DU gesendet hast
WHERE sender_id = auth.uid()
```

### Nachher (permissiv):
```sql
-- Alle Dateien in Conversations wo DU Mitglied bist
INNER JOIN conversation_members cm
WHERE cm.user_id = auth.uid()
```

### Praktischer Unterschied:

**Vorher:**
- ✅ Löschen: Dateien die du hochgeladen hast
- ❌ Löschen: Dateien die du empfangen hast

**Nachher:**
- ✅ Löschen: Dateien die du hochgeladen hast
- ✅ Löschen: Dateien die du empfangen hast
- ✅ Löschen: Dateien in "Meine Dateien" (Self-Conversation)

---

## Security Überlegungen

**Ist das sicher?**

Ja! User können nur Dateien in **ihren eigenen Conversations** löschen:
- User A kann Dateien in Conversation mit User B löschen ✅
- User A kann Dateien in Conversation mit User C **NICHT** löschen ❌
- User A kann seine eigenen "Meine Dateien" löschen ✅

**Warum ist das sinnvoll?**

Chat-Kontext: Wenn du eine Datei empfangen hast und sie aus deinem Chat löschen möchtest, solltest du das können (wie WhatsApp "Für mich löschen").

**Alternative (falls gewünscht):**

Falls du NUR sender-side Deletes willst, führe Migration nicht aus und behalte die alte Policy.

---

## Rollback (falls nötig)

```sql
-- Zurück zur restriktiven Policy
DROP POLICY IF EXISTS "Users can delete attachments in their conversations" ON message_attachments;

CREATE POLICY "Users can delete their own attachments"
  ON message_attachments
  FOR DELETE
  TO authenticated
  USING (
    message_id IN (
      SELECT id
      FROM messages
      WHERE sender_id = auth.uid()
    )
  );
```

---

## Status

- ⏳ **Not executed yet** - Warte auf User zum Ausführen
- Nach Ausführung: Update dieses File mit ✅
