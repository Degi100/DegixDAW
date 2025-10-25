# Changelog

Alle Änderungen an DegixDAW werden hier dokumentiert.

## [0.1.6] - 2025-10-25

### Added
- **Email-Einladungssystem** - Kollaboratoren können jetzt per Email eingeladen werden
  - 4-Schritt Projekt-Erstellungs-Wizard (Template → Details → Einladen → Sichtbarkeit)
  - Supabase Edge Function für Magic-Link Versand
  - Automatische Projekt-Zuweisung nach Registrierung via Database Trigger
  - Unterstützung für registrierte User und Email-Einladungen
  - Purple Badge-Styling für Email-Einladungen

### Changed
- **Projekt-Erstellung modernisiert** - Von 3-Schritt zu 4-Schritt Wizard erweitert
- **Collaborators Service erweitert** - `inviteByEmail()` mit Edge Function Integration
- **Database Trigger optimiert** - `handle_new_user()` schreibt jetzt korrekt in `user_id` Spalte

### Fixed
- **Critical Bug**: Database Trigger verhinderte User-Registrierung
- **Edge Function**: User-Existenz-Check vor `inviteUserByEmail()` Aufruf
- TypeScript: Unused variable warnings behoben

### Technical Details
- Neue Supabase Edge Function: `invite-user` (Deno/TypeScript)
- Neue DB-Tabelle: `pending_email_invitations` mit RLS Policies
- Neuer Trigger: `auto_add_invited_users` für automatische Kollaborator-Zuweisung
- SQL Migrations: `invite_user_by_email.sql`, `auto_add_invited_users_trigger.sql`

---

## [0.1.2] - 2025-10-05

### Fixed
- **Issue Management System** - Verbesserte Issue-Verfolgung und -Verwaltung
- **Chat UI Verbesserungen** - Bessere Darstellung von Chat-Nachrichten ("Du:" für eigene Nachrichten)
- **Datenbank-Konsistenz** - Kritische Fixes für user_id → id Spaltenkonflikte
  - Behoben: 406 Not Acceptable Fehler
  - Behoben: 403 Forbidden Fehler bei Profil-Erstellung
  - Behoben: RLS Policy Verletzungen

### Changed
- Verbesserte TypeScript-Konfiguration für bessere Entwicklungserfahrung

---

## [0.1.1] - 2025-10-04

### Added
- **Erweiterte Authentifizierung** - Verbesserte Benutzerauthentifizierung
- **Social Features** - Erste Version der sozialen Funktionen
- **Chat-System** - Grundlegende Chat-Funktionalität
- **Profil-Management** - Vollständiges Profil-System

### Fixed
- TypeScript exactOptionalPropertyTypes Fehler behoben
- Bundle-Splitting Optimierungen
- Supabase-Sicherheit durch Entfernung hartkodierter API-Keys

---

## [0.1.0] - 2025-10-01

### Added
- **Issue Management MVP** - Grundlegendes Issue-Management-System
- **Projekt-Grundgerüst** - Initiale Projektstruktur
- **Entwicklungsumgebung** - npm run app Kommando für Dev-Server

### Initial Release
- Grundlegende React-Anwendung mit Vite
- TypeScript-Konfiguration
- ESLint Setup

---

*Das Format basiert auf [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)*
