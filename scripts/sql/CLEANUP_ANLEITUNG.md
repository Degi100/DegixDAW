# 🗑️ Datenbank Cleanup Anleitung

## Schritt 1: Backup erstellen

Bevor du Duplikate löschst, erstelle ein Backup:

### Option A: Supabase Dashboard
1. Öffne [Supabase Dashboard](https://supabase.com/dashboard)
2. Wähle dein Projekt: **DegixDAW**
3. Gehe zu **Database** → **Backups**
4. Klicke **Create Backup** (oder nutze automatisches Backup)

### Option B: SQL Export
1. Öffne **SQL Editor** in Supabase
2. Führe aus:
```sql
-- Export vor Cleanup
COPY (SELECT * FROM public.issues) 
TO '/tmp/issues_backup.csv' 
WITH (FORMAT CSV, HEADER);
```

## Schritt 2: Duplikate prüfen

Öffne **SQL Editor** und führe aus:

```sql
-- Zeige alle Duplikate
SELECT title, COUNT(*) as count 
FROM public.issues 
GROUP BY title 
HAVING COUNT(*) > 1
ORDER BY count DESC;
```

**Erwartetes Ergebnis:** Liste mit Titeln die mehrfach vorkommen

## Schritt 3: Cleanup ausführen

Führe das Cleanup-Script aus:

```bash
# Im Terminal (oder kopiere Inhalt in SQL Editor)
cat scripts/sql/cleanup_issues.sql
```

**Oder direkt in Supabase SQL Editor:**

1. Öffne `scripts/sql/cleanup_issues.sql`
2. Kopiere den Inhalt
3. Füge in Supabase SQL Editor ein
4. Klicke **Run**

## Schritt 4: Verifizierung

Nach dem Cleanup prüfen:

```sql
-- Prüfe ob Duplikate weg sind
SELECT title, COUNT(*) as count 
FROM public.issues 
GROUP BY title 
HAVING COUNT(*) > 1;

-- Sollte: 0 Zeilen zurückgeben

-- Zeige alle verbliebenen Issues
SELECT id, title, status, priority, created_at 
FROM public.issues 
ORDER BY created_at DESC;
```

## 🎯 Was wird gelöscht?

Das Script:
- ✅ Behält das **älteste** Issue pro Titel (erstes `created_at`)
- ❌ Löscht alle **neueren Duplikate** desselben Titels
- ✅ Behaltet alle einzigartigen Issues

## ⚠️ Wichtig

- Backup VORHER erstellen!
- Script löscht nur nach `title` - Issues mit identischen Titeln aber unterschiedlichen Daten werden als Duplikate behandelt
- Nach Cleanup: App neu laden um aktualisierte Liste zu sehen

## 🔄 Rollback (falls nötig)

Falls etwas schief geht:
1. Gehe zu **Database** → **Backups**
2. Wähle letztes Backup vor Cleanup
3. Klicke **Restore**

---

**Status:** Ready to execute
**Version:** 0.1.1
**Datum:** 3. Oktober 2025
