# 🗄️ Database Automation Scripts

Automatische SQL-Script-Ausführung für Supabase ohne manuelles Copy-Paste im Dashboard!

## 📦 Voraussetzungen

### .env Konfiguration

Füge deinen **Supabase Service Role Key** zur `.env` hinzu:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # NEU!
```

**Service Role Key finden:**
1. Öffne [Supabase Dashboard](https://supabase.com/dashboard)
2. Wähle dein Projekt
3. Gehe zu **Settings** → **API**
4. Kopiere den **`service_role`** Key (⚠️ Geheim halten!)

---

## 🚀 Verfügbare Commands

### `npm run db:mark-done`
**Markiert erledigte Issues als DONE**
```bash
npm run db:mark-done
```
- Führt `mark_issues_done.sql` aus
- Updated Status von 3 Issues auf "done"
- Zeigt Statistiken

### `npm run db:cleanup`
**Löscht Duplikate aus der Datenbank**
```bash
npm run db:cleanup
```
- Führt `cleanup_issues.sql` aus
- ⚠️ Fragt vor dem Löschen nach Bestätigung
- Behält älteste Issues, löscht neuere Duplikate

### `npm run db:seed`
**Fügt Test-Daten ein**
```bash
npm run db:seed
```
- Führt `seed_issues.sql` aus
- Erstellt 19 Test-Issues
- Gut für Development/Testing

### `npm run db:migrate`
**Führt alle Migrations aus**
```bash
npm run db:migrate
```
- Setup: `supabase_setup.sql`
- Issues Table: `issues_table_setup.sql`
- Admin Flag: `set_admin_flag.sql`

### `npm run db:sql <file>`
**Führt beliebige SQL-Datei aus**
```bash
npm run db:sql scripts/sql/debug_rls_policies.sql
```
- Flexibel für jede SQL-Datei
- Zeigt SQL-Inhalt an

---

## 📁 Dateistruktur

```
scripts/
├── db/
│   ├── sql-executor.js      # Hauptlogik für SQL-Ausführung
│   ├── run-sql.js            # Einfache SQL-Runner Alternative
│   ├── migrate.js            # Migration Runner
│   ├── seed.js               # Database Seeder
│   ├── cleanup.js            # Cleanup Runner
│   └── mark-done.js          # Mark Issues Done Runner
│
└── sql/
    ├── cleanup_issues.sql
    ├── mark_issues_done.sql
    ├── seed_issues.sql
    ├── supabase_setup.sql
    ├── issues_table_setup.sql
    └── ...
```

---

## 🔧 Wie es funktioniert

### 1. Service Role Key
Die Scripts verwenden den **Service Role Key** um direkt mit Supabase zu kommunizieren (Bypass RLS).

### 2. SQL Parsing
- Liest `.sql` Dateien
- Split nach Semikolons (`;`)
- Filtert Kommentare (`--`)
- Führt Statements einzeln aus

### 3. Error Handling
- Zeigt Fortschritt pro Statement
- Zählt Erfolge/Fehler
- Gibt Summary am Ende aus

---

## ⚠️ Wichtige Hinweise

### Sicherheit
- ❌ **Service Role Key NIEMALS committen!**
- ✅ `.env` ist in `.gitignore`
- ✅ Nur lokal verwenden

### RLS (Row Level Security)
- Service Role Key bypassed RLS Policies
- Perfekt für Admin-Operationen
- ⚠️ Vorsichtig nutzen!

### Alternativen

Falls Service Role Key nicht verfügbar:
1. **Supabase CLI** (Migrations): `supabase db push`
2. **pgAdmin** (Direct DB Access)
3. **Dashboard SQL Editor** (Manuell, aber sicher)

---

## 🎯 Beispiel-Workflow

```bash
# 1. Issues als done markieren
npm run db:mark-done

# 2. Duplikate bereinigen
npm run db:cleanup

# 3. Test-Daten hinzufügen
npm run db:seed

# 4. Custom SQL ausführen
npm run db:sql scripts/sql/debug_rls_policies.sql
```

---

## 🐛 Troubleshooting

### Error: Missing SUPABASE_SERVICE_ROLE_KEY
```bash
❌ Missing Supabase credentials!
```
**Lösung:** Füge Service Role Key zur `.env` hinzu

### RPC Error
Falls RPC-Calls fehlschlagen, fällt das Script auf direkte Queries zurück.

### Connection Timeout
Prüfe Internetverbindung und Supabase Status.

---

## ✅ Vorteile

- ⚡ **Schneller** - Kein Dashboard-Login mehr
- 🔄 **Wiederholbar** - Ein Command, fertig
- 📝 **Versioniert** - SQL-Files in Git
- 🤖 **Automatisierbar** - In CI/CD integrierbar
- 🛡️ **Sicher** - Service Key nur lokal

---

**Version:** 0.2.0  
**Status:** ✅ Production Ready  
**Issue:** #20 - Datenbank scripte automatisch
