# Changelog

Alle Änderungen an DegixDAW werden hier dokumentiert.

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
