# Database Migrations - DegixDAW

**Erstellt:** 2025-10-17

---

## ⚠️ **WICHTIG: Migrations-Reihenfolge**

Diese Migrations sind **schrittweise** aufgeteilt, damit du bei jedem Schritt testen kannst!

**Reihenfolge:**
```
001_create_tables.sql       → Neue Tabellen erstellen
002_create_indexes.sql      → Performance-Indexes hinzufügen
003_create_triggers.sql     → Auto-Update Triggers
004_enable_rls.sql          → RLS aktivieren (READ THIS FIRST!)
005_create_policies.sql     → RLS Policies erstellen
006_storage_buckets.sql     → Storage Buckets + Policies
```

---

## ✅ **SICHERHEITS-CHECKLISTE**

### Vor der Migration:

- [ ] **Backup erstellen!** (Supabase Dashboard → Database → Backups)
- [ ] Aktuelle Policies notieren (siehe SQL unten)
- [ ] Test-Projekt erstellen (optional, aber empfohlen!)

```sql
-- Check existing policies:
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

### Nach jedem Schritt:

- [ ] **Test Login** (https://app.degixdaw.com)
- [ ] **Test Chat** (Send message)
- [ ] **Test Admin** (Open admin panel)

**Falls etwas nicht funktioniert:**
```sql
-- Rollback letzter Schritt:
-- z.B. Tabellen löschen:
DROP TABLE IF EXISTS project_versions CASCADE;
DROP TABLE IF EXISTS track_comments CASCADE;
DROP TABLE IF EXISTS presets CASCADE;
DROP TABLE IF EXISTS mixdowns CASCADE;
DROP TABLE IF EXISTS midi_events CASCADE;
DROP TABLE IF EXISTS tracks CASCADE;
DROP TABLE IF EXISTS project_collaborators CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
```

---

## 📋 **MIGRATIONS-SCHRITTE**

### **Schritt 1: Tabellen erstellen**

```bash
# File: 001_create_tables.sql
# Was: Erstellt 8 neue Tabellen (projects, tracks, etc.)
# Risk: SAFE ✅ (berührt bestehende Tabellen NICHT)
# Time: ~10 Sekunden
```

**Test nach diesem Schritt:**
```sql
-- Verify tables created:
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND (table_name LIKE '%project%' OR table_name LIKE '%track%' OR table_name LIKE '%preset%');

-- Expected: 8 rows (projects, project_collaborators, tracks, midi_events, mixdowns, presets, track_comments, project_versions)
```

**Funktioniert Login/Chat?** ✅ (sollte noch funktionieren)

---

### **Schritt 2: Indexes erstellen**

```bash
# File: 002_create_indexes.sql
# Was: Erstellt Performance-Indexes
# Risk: SAFE ✅ (nur Performance-Optimierung)
# Time: ~20 Sekunden
```

**Test nach diesem Schritt:**
```sql
-- Verify indexes:
SELECT tablename, indexname FROM pg_indexes
WHERE schemaname = 'public'
AND (tablename LIKE '%project%' OR tablename LIKE '%track%')
ORDER BY tablename;

-- Expected: ~20 indexes
```

**Funktioniert Login/Chat?** ✅

---

### **Schritt 3: Triggers erstellen**

```bash
# File: 003_create_triggers.sql
# Was: Auto-update updated_at + search_vector
# Risk: SAFE ✅ (nur auf neue Tabellen)
# Time: ~5 Sekunden
```

**Test nach diesem Schritt:**
```sql
-- Verify triggers:
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public'
AND (event_object_table LIKE '%project%' OR event_object_table LIKE '%track%');

-- Expected: 6 triggers
```

**Funktioniert Login/Chat?** ✅

---

### **Schritt 4: RLS aktivieren**

```bash
# File: 004_enable_rls.sql
# Was: Aktiviert RLS auf neuen Tabellen
# Risk: MEDIUM ⚠️ (blockiert Zugriff ohne Policies!)
# Time: ~5 Sekunden
```

**WICHTIG:**
- ⚠️ Nach diesem Schritt: Neue Tabellen sind **leer UND gesperrt**
- ⚠️ Bis Schritt 5 (Policies) ist kein Zugriff möglich
- ✅ Alte Tabellen (chat, profiles) **unberührt**

**Test nach diesem Schritt:**
```sql
-- Verify RLS enabled:
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND (tablename LIKE '%project%' OR tablename LIKE '%track%');

-- All should show rowsecurity = true
```

**Funktioniert Login/Chat?** ✅ (Ja! Alte Tabellen unberührt)

---

### **Schritt 5: RLS Policies erstellen**

```bash
# File: 005_create_policies.sql
# Was: Erstellt Policies für Zugriffskontrolle
# Risk: SAFE ✅ (gibt Zugriff frei)
# Time: ~30 Sekunden
```

**Test nach diesem Schritt:**
```sql
-- Verify policies:
SELECT tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
AND (tablename LIKE '%project%' OR tablename LIKE '%track%')
ORDER BY tablename;

-- Expected: ~30 policies
```

**Teste: Kann User Projekt erstellen?**
```sql
-- Als authenticated user:
INSERT INTO projects (creator_id, title, bpm)
VALUES (auth.uid(), 'Test Project', 120);

-- Should work! ✅
```

**Funktioniert Login/Chat?** ✅

---

### **Schritt 6: Storage Buckets erstellen**

```bash
# File: 006_storage_buckets.sql
# Was: Erstellt neue Storage Buckets + Policies
# Risk: SAFE ✅ (neue Buckets, alte bleiben)
# Time: ~10 Sekunden
```

**Test nach diesem Schritt:**
```sql
-- Verify buckets:
SELECT id, name, public FROM storage.buckets;

-- Expected:
-- chat-attachments (existing) ✅
-- music-projects (new) 🆕
-- project-thumbnails (new) 🆕
-- user-samples (new) 🆕
```

**Funktioniert Chat-Attachments?** ✅ (alter Bucket unberührt)

---

## 🔄 **ROLLBACK (Falls nötig)**

### Rollback Schritt 6 (Storage)
```sql
DELETE FROM storage.buckets WHERE id IN ('music-projects', 'project-thumbnails', 'user-samples');
```

### Rollback Schritt 5 (Policies)
```sql
-- Drop all new policies:
DROP POLICY IF EXISTS "users_read_own_and_shared_projects" ON projects;
DROP POLICY IF EXISTS "users_create_projects" ON projects;
-- ... (alle Policies aus 005_create_policies.sql)
```

### Rollback Schritt 4 (RLS)
```sql
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE project_collaborators DISABLE ROW LEVEL SECURITY;
ALTER TABLE tracks DISABLE ROW LEVEL SECURITY;
ALTER TABLE midi_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE mixdowns DISABLE ROW LEVEL SECURITY;
ALTER TABLE presets DISABLE ROW LEVEL SECURITY;
ALTER TABLE track_comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE project_versions DISABLE ROW LEVEL SECURITY;
```

### Rollback Schritt 1-3 (Alles löschen)
```sql
DROP TABLE IF EXISTS project_versions CASCADE;
DROP TABLE IF EXISTS track_comments CASCADE;
DROP TABLE IF EXISTS presets CASCADE;
DROP TABLE IF EXISTS mixdowns CASCADE;
DROP TABLE IF EXISTS midi_events CASCADE;
DROP TABLE IF EXISTS tracks CASCADE;
DROP TABLE IF EXISTS project_collaborators CASCADE;
DROP TABLE IF EXISTS projects CASCADE;

DROP FUNCTION IF EXISTS update_updated_at CASCADE;
DROP FUNCTION IF EXISTS update_search_vector CASCADE;
```

---

## ✅ **ERFOLGREICHE MIGRATION**

Nach allen 6 Schritten solltest du haben:

```sql
-- 8 neue Tabellen
SELECT COUNT(*) FROM information_schema.tables
WHERE table_schema = 'public'
AND (table_name LIKE '%project%' OR table_name LIKE '%track%' OR table_name LIKE '%preset%');
-- Expected: 8

-- ~20 neue Indexes
SELECT COUNT(*) FROM pg_indexes
WHERE schemaname = 'public'
AND (tablename LIKE '%project%' OR tablename LIKE '%track%');
-- Expected: ~20

-- ~30 neue Policies
SELECT COUNT(*) FROM pg_policies
WHERE schemaname = 'public'
AND (tablename LIKE '%project%' OR tablename LIKE '%track%');
-- Expected: ~30

-- 3 neue Storage Buckets
SELECT COUNT(*) FROM storage.buckets WHERE id LIKE '%music%' OR id LIKE '%project%' OR id LIKE '%sample%';
-- Expected: 3
```

**UND:**
- ✅ Login funktioniert
- ✅ Chat funktioniert
- ✅ Admin funktioniert
- ✅ Neue Music-Features bereit!

---

## 🎯 **NÄCHSTE SCHRITTE**

Nach erfolgreicher Migration:

1. **Frontend anpassen:**
   - MIDI Editor bauen (Tone.js)
   - Project Management UI
   - Track Timeline

2. **VST Plugin bauen:**
   - JUCE Setup
   - Supabase Client
   - OAuth Flow

3. **Testing:**
   - Create Test Project
   - Upload MIDI
   - Download from VST

---

**Bei Fragen oder Problemen: STOP und frag mich!** 🛑
