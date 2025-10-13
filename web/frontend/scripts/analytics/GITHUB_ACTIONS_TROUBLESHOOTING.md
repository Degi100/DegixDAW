# GitHub Actions Troubleshooting - Analytics Snapshots

## 🐛 Gefundenes Problem

Der GitHub Actions Workflow `daily-snapshot.yml` schlug fehl wegen eines **falschen RPC-Funktionsaufrufs**.

### Root Cause

**Datei:** `scripts/analytics/create-snapshot-github-actions.js` (Zeile 218)

```javascript
// ❌ FALSCH (Alt)
const { data, error } = await supabase.rpc('pg_database_size', {
  database_name: 'postgres'
});
```

**Problem:**
- `pg_database_size` ist eine **built-in PostgreSQL-Funktion**, die NICHT direkt über Supabase RPC aufrufbar ist
- Supabase bietet stattdessen eine **Wrapper-RPC-Funktion** namens `get_database_size()` an
- Diese wurde bereits in `scripts/sql/analytics_storage_functions.sql` definiert

### Weitere potenzielle Probleme

1. **Fehlende Tabelle:** `project_snapshots` existiert nicht in Supabase
2. **Fehlende Columns:** Language-Breakdown-Columns fehlen
3. **Fehlende RPC-Funktion:** `get_database_size()` wurde nicht deployed
4. **Fehlende GitHub Secrets:** `VITE_SUPABASE_URL` oder `SUPABASE_SERVICE_ROLE_KEY`

---

## ✅ Lösung

### 1. Script gefixt

**Datei:** `scripts/analytics/create-snapshot-github-actions.js` (Zeile 218)

```javascript
// ✅ KORREKT (Neu)
const { data, error } = await supabase.rpc('get_database_size');
```

**Was geändert wurde:**
- ❌ `pg_database_size` → ✅ `get_database_size`
- ❌ Parameter `database_name` entfernt (nicht benötigt)

---

### 2. Diagnose-Tool erstellt

**Neues Script:** `scripts/sql/diagnose_analytics_setup.sql`

Prüft automatisch:
- ✅ Tabelle `project_snapshots` existiert
- ✅ Language-Breakdown-Columns existieren
- ✅ RLS Policies sind konfiguriert
- ✅ RPC-Funktion `get_database_size()` existiert
- ✅ INSERT-Permissions funktionieren

**Usage:**
```bash
npm run analytics:diagnose
```

**Beispiel-Output:**
```
✅ Table project_snapshots exists
✅ All language breakdown columns exist
✅ RLS policies exist (3 policies)
📋 Current RLS Policies:
   - Admins can read all snapshots
   - Admins can create snapshots
   - Admins can delete snapshots
✅ Function get_database_size exists
✅ INSERT permission test PASSED
📊 Existing Snapshots:
   Total: 5
   Latest: 2025-10-11
```

---

### 3. RLS-Fix-Script erstellt (optional)

**Neues Script:** `scripts/sql/fix_analytics_snapshots_rls.sql`

Falls RLS-Policies Probleme machen (sollte normalerweise NICHT nötig sein, da Service Role Key RLS bypassed).

**Usage:**
```bash
npm run analytics:fix-rls
```

---

## 🧪 Testing nach dem Fix

### Schritt 1: Lokale Diagnose

```bash
# 1. Prüfe ob alle DB-Objekte existieren
npm run analytics:diagnose

# 2. Falls Fehler: Setup ausführen
npm run db:sql analytics_snapshots_table
npm run db:sql analytics_snapshots_language_breakdown
npm run db:sql analytics_storage_functions
```

### Schritt 2: Lokaler Snapshot-Test

```bash
# Setze Environment Variables
export VITE_SUPABASE_URL="https://YOUR_PROJECT.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="eyJ..."

# Teste Script lokal
npm run analytics:snapshot
```

**Erwartete Ausgabe:**
```
🚀 Daily Snapshot Creator - GitHub Actions Edition
================================================

✅ Supabase client initialized
📊 Calculating code metrics...
   ✅ Total LOC: 12,345
   ✅ Files: 234
   ✅ Commits: 567
   ✅ Age: 18 days (since 2025-09-24)
   📊 Languages: TS=8900 | JS=1200 | SCSS=890 | SQL=234

📊 Fetching project metrics...
   ✅ Users: 5 (4 active)
   ✅ Messages: 42 (3 conversations)
   ✅ Issues: 12 (3 open, 2 in progress, 7 closed)

📊 Calculating storage stats...
   ✅ Database: 52.30 MB
   ✅ Storage: 0 MB

🔄 Creating snapshot for 2025-10-11...

✅ Snapshot created successfully!
   ID: abc-123-def-456
   Date: 2025-10-11
   LOC: 12,345
   Users: 5
   Messages: 42
   Issues: 12

🎉 Success! Snapshot created.
```

### Schritt 3: GitHub Actions testen

```bash
# 1. Commit & Push
git add .
git commit -m "🐛 Fix GitHub Actions snapshot creation (RPC function name)"
git push

# 2. Öffne GitHub Actions
https://github.com/Degi100/DegixDAW/actions

# 3. Klicke "Daily Analytics Snapshot"
# 4. Klicke "Run workflow" (rechts oben)
# 5. Klicke "Run workflow" (grüner Button)
# 6. Warte ~2 Minuten
# 7. ✅ Check Logs
```

**Was zu prüfen ist:**
- ✅ Alle Steps sind grün (kein rotes X)
- ✅ "Create Analytics Snapshot" zeigt korrekten Output
- ✅ Keine Error-Messages in Logs
- ✅ "Success Notification" wurde ausgeführt

### Schritt 4: Supabase-Datenbank prüfen

Öffne Supabase SQL Editor:

```sql
SELECT * FROM project_snapshots
ORDER BY snapshot_date DESC
LIMIT 1;
```

**Erwartete Werte:**
- ✅ `snapshot_date` = heutiges Datum
- ✅ `total_loc` > 0
- ✅ `total_commits` > 0
- ✅ `typescript_loc` > 0
- ✅ `metadata->>'created_via'` = `'github_actions'`
- ✅ `metadata->>'workflow'` = `'Daily Analytics Snapshot'`

---

## 📝 Checkliste: Vollständiges Setup

### Datenbank (Supabase)

- [ ] Tabelle `project_snapshots` existiert
  ```bash
  npm run db:sql analytics_snapshots_table
  ```

- [ ] Language-Breakdown-Columns hinzugefügt
  ```bash
  npm run db:sql analytics_snapshots_language_breakdown
  ```

- [ ] RPC-Funktionen deployed (`get_database_size`, `get_table_sizes`)
  ```bash
  npm run db:sql analytics_storage_functions
  ```

### GitHub Repository

- [ ] GitHub Secret `VITE_SUPABASE_URL` gesetzt
  ```
  https://github.com/Degi100/DegixDAW/settings/secrets/actions
  ```

- [ ] GitHub Secret `SUPABASE_SERVICE_ROLE_KEY` gesetzt
  ```
  https://github.com/Degi100/DegixDAW/settings/secrets/actions
  ```

- [ ] Workflow-Datei existiert
  ```
  .github/workflows/daily-snapshot.yml
  ```

- [ ] Script gefixt (RPC-Aufruf korrigiert)
  ```
  scripts/analytics/create-snapshot-github-actions.js
  ```

### Testing

- [ ] Lokale Diagnose läuft ohne Fehler
  ```bash
  npm run analytics:diagnose
  ```

- [ ] Lokaler Snapshot-Test erfolgreich
  ```bash
  npm run analytics:snapshot
  ```

- [ ] GitHub Actions Workflow läuft erfolgreich
  ```
  https://github.com/Degi100/DegixDAW/actions
  ```

- [ ] Snapshot erscheint in Supabase-Datenbank
  ```sql
  SELECT * FROM project_snapshots ORDER BY snapshot_date DESC LIMIT 1;
  ```

---

## 🔗 Verwandte Dateien

### Scripts
- [create-snapshot-github-actions.js](./create-snapshot-github-actions.js) - Hauptscript (GEFIXT)
- [diagnose_analytics_setup.sql](../sql/diagnose_analytics_setup.sql) - Diagnose-Tool (NEU)
- [fix_analytics_snapshots_rls.sql](../sql/fix_analytics_snapshots_rls.sql) - RLS-Fix (NEU, optional)

### SQL Setup
- [analytics_snapshots_table.sql](../sql/analytics_snapshots_table.sql) - Tabellen-Definition
- [analytics_snapshots_language_breakdown.sql](../sql/analytics_snapshots_language_breakdown.sql) - Language-Columns
- [analytics_storage_functions.sql](../sql/analytics_storage_functions.sql) - RPC-Funktionen

### Dokumentation
- [GITHUB_ACTIONS_SETUP.md](./GITHUB_ACTIONS_SETUP.md) - Komplette Setup-Anleitung
- [README.md](./README.md) - Analytics-System-Übersicht

---

## 💡 Lessons Learned

1. **Supabase RPC vs PostgreSQL Built-ins:**
   - PostgreSQL-Funktionen wie `pg_database_size` können NICHT direkt via Supabase RPC aufgerufen werden
   - Wrapper-Funktionen mit `SECURITY DEFINER` sind erforderlich
   - Diese müssen im Supabase SQL Editor deployed werden

2. **Service Role Key bypassed RLS:**
   - GitHub Actions nutzt Service Role Key → RLS-Policies werden automatisch ignoriert
   - ABER: Policies müssen trotzdem existieren für Frontend-Zugriff
   - `SECURITY DEFINER` RPC-Funktionen laufen mit erhöhten Rechten

3. **Diagnose-Tools sind essentiell:**
   - Automatische Checks reduzieren Debugging-Zeit
   - SQL-Scripts können Fehler direkt identifizieren
   - Integration in npm-Scripts macht sie leicht nutzbar

---

**Status:** ✅ GEFIXT (2025-10-11)

Bei weiteren Problemen: [Issues öffnen](https://github.com/Degi100/DegixDAW/issues)