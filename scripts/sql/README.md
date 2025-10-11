# SQL Scripts für Supabase

Dieses Verzeichnis enthält alle SQL-Skripte für die Datenbank-Einrichtung und Wartung.

## ⚡ Quick Start (Neues Projekt)

**Problem: User-Tabelle in Admin-Panel ist leer?**
→ Du hast `admin_role_system_setup.sql` noch nicht ausgeführt!

**3 Schritte zur Lösung:**
```bash
# 1. Script-Inhalt anzeigen
npm run db:show scripts/sql/admin_role_system_setup.sql

# 2. Öffne Supabase SQL-Editor
# https://supabase.com/dashboard/project/YOUR_PROJECT/sql

# 3. Kopiere Script-Inhalt, klicke "Run" ✅
```

**Danach:** User-Tabelle zeigt alle angemeldeten User!

---

## 🚀 MUST-RUN Scripts (In dieser Reihenfolge!)

### 1. `admin_role_system_setup.sql` ⭐ KRITISCH
**Admin Role-System + User Management**
- Erstellt Role-System (user/moderator/admin)
- RPC Function: `get_all_users_with_metadata()`
- Super Admin Protection (DB-Level)
- **OHNE DIESES SCRIPT: User-Tabelle bleibt leer!**
- 📖 Dokumentation: [ADMIN_ROLE_SYSTEM.md](ADMIN_ROLE_SYSTEM.md)

```bash
# Script anzeigen:
npm run db:show scripts/sql/admin_role_system_setup.sql
# Dann in Supabase SQL-Editor kopieren + ausführen
```

### 2. `feature_flags_setup.sql`
**Feature-Flags System**
- Erstellt `feature_flags` Tabelle
- RLS Policies + Realtime
- Für Feature-Toggle Funktionalität

### 3. `chat_system_setup.sql`
**Chat-Funktionalität**
- Erstellt Chat-Tabellen (conversations, messages, etc.)
- RLS Policies für Chat-Zugriff

---

## 📦 Legacy Setup Scripts

### `supabase_setup.sql` (⚠️ VERALTET)
- Alte Version ohne Role-System
- **Nutze stattdessen: admin_role_system_setup.sql**

### `issues_table_setup.sql`
**Issue Management Tabelle**
- Detailliertes Setup für die Issues-Tabelle
- RLS Policies für Admin-Zugriff
- Indizes für Performance

## 🔧 Maintenance Scripts

### `safety_check_issues.sql` ⭐ NEW
**Cleanup Vorschau (SICHER)**
- Zeigt was gelöscht werden würde
- Preview ohne Änderungen
- **Führe DIES ZUERST aus!**

### `cleanup_issues.sql` ⚠️
**Duplikate entfernen (DESTRUCTIVE)**
- Findet doppelte Issues
- Löscht Duplikate (behält ältesten Eintrag)
- Verifiziert Cleanup
- **Siehe `CLEANUP_ANLEITUNG.md` für Details!**

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
