# SQL Scripts für Supabase

Dieses Verzeichnis enthält alle SQL-Skripte für die Datenbank-Einrichtung und Wartung.

## 📦 Setup Scripts

### `supabase_setup.sql`
**Vollständiges Datenbank-Setup** - Führe dies zuerst aus!
- Erstellt alle Tabellen (users, issues, etc.)
- Richtet RLS Policies ein
- Erstellt Trigger und Indizes

### `issues_table_setup.sql`
**Issue Management Tabelle**
- Detailliertes Setup für die Issues-Tabelle
- RLS Policies für Admin-Zugriff
- Indizes für Performance

## 🔧 Maintenance Scripts

### `cleanup_issues.sql`
**Duplikate entfernen**
- Findet doppelte Issues
- Löscht Duplikate (behält ältesten Eintrag)
- Verifiziert Cleanup

### `set_admin_flag.sql`
**Admin-Flag setzen**
- Setzt `is_admin = true` für Super-Admin
- Email: rene.degering2014@gmail.com

### `seed_issues.sql`
**Test-Daten einfügen**
- 19 Test-Issues für Development
- Verschiedene Prioritäten und Status

## 🐛 Debug Scripts

### `debug_rls_policies.sql`
**RLS Policies debuggen**
- Zeigt alle Policies
- Prüft User-Metadaten
- Testet Zugriffe

### `fix_rls_policies.sql`
**RLS Policies korrigieren**
- Behebt 403-Fehler
- Wechselt von jwt() zu uid()
- Admin-Check via raw_user_meta_data

## 🚀 Verwendung

### Neues Projekt Setup
1. Gehe zu Supabase SQL Editor
2. Führe `supabase_setup.sql` aus
3. Führe `set_admin_flag.sql` aus (mit deiner Email)
4. Optional: `seed_issues.sql` für Test-Daten

### Datenbank-Wartung
- **Duplikate entfernen:** `cleanup_issues.sql`
- **RLS-Probleme:** `debug_rls_policies.sql` + `fix_rls_policies.sql`

## ⚠️ Hinweise

- Skripte sind für **PostgreSQL (Supabase)**
- RLS Policies müssen aktiviert sein
- Admin-Flag wird via `raw_user_meta_data` geprüft
- Bei Problemen: Check `debug_rls_policies.sql`
