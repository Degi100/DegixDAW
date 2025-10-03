# 📚 Dokumentation

Willkommen zur Projekt-Dokumentation!

## 📖 Inhaltsverzeichnis

### [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md)
**Projekt-Übersicht**
- Technologie-Stack
- Architektur
- Feature-Liste
- Verzeichnisstruktur

### [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)
**Supabase Einrichtung**
- Datenbank-Setup
- RLS Policies
- Authentication
- Admin-User Konfiguration

### [TOKEN_MANAGEMENT.md](./TOKEN_MANAGEMENT.md)
**Token-Verwaltung**
- Supabase Session Management
- Token Refresh Strategien
- Best Practices

## 🚀 Quick Links

### Hauptdokumentation
- [**README.md**](../README.md) - Projekt-Übersicht & Quick Start
- [**DEPLOYMENT.md**](../DEPLOYMENT.md) - Deployment Guide

### Technische Dokumentation
- [**API Server**](../server/README.md) - Express API für lokale Entwicklung
- [**SQL Scripts**](../scripts/sql/README.md) - Datenbank-Skripte & Migrations
- [**Pages**](../src/pages/README.md) - Seiten-Struktur
- [**Styles**](../src/styles/README.md) - SCSS-Architektur

## 🏗️ Architektur-Übersicht

```
Frontend (React + TypeScript + Vite)
    ├── Authentication (Supabase Auth)
    ├── User Management (Admin Panel)
    ├── Issue Tracking System
    ├── Profile Settings
    └── Analytics Dashboard

Backend (Supabase)
    ├── PostgreSQL Database
    ├── Row Level Security (RLS)
    ├── Real-time Subscriptions
    └── Edge Functions (optional)

Deployment (Netlify)
    ├── Static Site Hosting
    ├── Serverless Functions
    ├── CI/CD via GitHub
    └── Environment Variables
```

## 🎯 Für Entwickler

### Erste Schritte
1. Clone Repository
2. `npm install`
3. Setup Supabase (siehe [SUPABASE_SETUP.md](./SUPABASE_SETUP.md))
4. Kopiere `.env.example` → `.env`
5. `npm run dev`

### Development Workflow
1. Branch erstellen: `git checkout -b feature/xyz`
2. Entwickeln & Testen
3. TypeScript prüfen: `npx tsc --noEmit`
4. Commit & Push
5. Pull Request erstellen

### Deployment
Siehe [DEPLOYMENT.md](../DEPLOYMENT.md) für vollständige Anleitung.

## 📝 Weitere Ressourcen

- [Supabase Docs](https://supabase.com/docs)
- [React Router Docs](https://reactrouter.com/)
- [Vite Docs](https://vitejs.dev/)
- [TypeScript Docs](https://www.typescriptlang.org/)

## 🐛 Issues & Feature Requests

Issues werden über das **Issue Management System** im Admin-Panel verwaltet:
- Öffne Admin-Panel
- Navigiere zu "Issue Management"
- Erstelle, bearbeite oder tracke Issues

Alternativ: [GitHub Issues](https://github.com/Degi100/DegixDAW/issues)
