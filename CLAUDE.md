# CLAUDE.md

Anleitungen für Claude Code bei der Arbeit mit dem DegixDAW Monorepo.

## Monorepo-Struktur

```
DegixDAW/
├── web/
│   ├── frontend/        # React 19 + TypeScript (Port 5173)
│   └── backend/         # Express API (Port 3001)
├── desktop/             # C++ Desktop App (MSVC)
├── packages/            # Shared Types/Utils/Constants
├── docs/architecture/   # Architektur-Docs
└── nixpacks.toml        # Coolify Deployment Config
```

## Entwicklungsbefehle

```bash
npm run dev:all          # Frontend + Backend gleichzeitig
npm run build:all        # Production Build
npm run lint:all         # Linting
npm start                # Backend Production Mode
```

## 🔥 Claude Code-Qualität Regeln (SEHR WICHTIG!)

### 1. Monolith vermeiden - Clean Code schreiben!
- Keine Files >400 Zeilen (Split in Components/Hooks/Utils)
- DRY Prinzip: Config-Arrays statt Copy-Paste
- Component Extraction bei >2x Duplikation
- Custom Hooks für Data/Actions trennen

### 2. Folder-Struktur strikt einhalten!
```
✅ RICHTIG:
web/frontend/src/
  ├── components/
  │   └── admin/analytics/GrowthChart.tsx
  ├── styles/
  │   └── components/admin/analytics/_growth-chart.scss  ← SCSS hier!
  ├── hooks/
  │   └── useAnalytics.ts
  └── lib/
      └── services/analytics/snapshotsService.ts

❌ FALSCH:
web/frontend/src/components/admin/analytics/
  ├── GrowthChart.tsx
  └── GrowthChart.scss  ← NICHT in /components/!
```

### 3. SCSS verwenden - Inline-Styling nur wenn zwingend nötig!
```tsx
// ✅ GOOD: CSS Variables für dynamische Werte
<line stroke={`var(--metric-color)`} />

// ❌ BAD: Inline-Styles ohne Grund
<div style={{ color: 'red', fontSize: '14px' }}>...</div>
```

### 4. Dev-Server NIEMALS manuell starten!
```bash
# ❌ FALSCH - Claude startet NICHT:
npm run dev

# ✅ RICHTIG - Läuft bereits via npm run dev:all
# Falls NICHT running → Claude fragt User ZUERST!
```

**Warum:** User hat Server bereits laufen. Claude's restart = Duplicate Processes (Port-Conflicts!)

### 5. 🚨 NIEMALS auf `main` Branch arbeiten!
```bash
# ✅ VOR JEDER Code-Änderung: Branch prüfen!
git branch --show-current

# Wenn Output = "main":
# ❌ STOPP! Keine Änderungen!
# ✅ User fragen: "Du bist auf main. Soll ich einen Feature-Branch erstellen?"
```

**Regel:** KEINE Änderungen auf `main` ohne explizite User-Bestätigung!

## Deployment (Coolify)

**Config:** `nixpacks.toml`

```bash
# Build
npm run build:frontend  # → web/frontend/dist
npm run build:backend   # → web/backend/dist

# Start
NODE_ENV=production npm start  # Backend serves Frontend static files
```

**Environment Variables (Coolify):**
```env
NODE_ENV=production
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
FRONTEND_URL=http://degix.94.130.185.204.sslip.io
```

**Production URL:** http://degix.94.130.185.204.sslip.io

## Git Workflow

**Branch-Strategie:**
- `main`: Production (deployed)
- `develop`: Integration Branch
- `feature/*`: Feature Branches

**Commit-Konventionen:**
```
feat(frontend): add user profile page
fix(backend): resolve CORS issue
chore(packages): update shared types
docs(readme): update monorepo structure
```

## 🐛 Issues erstellen (CLI)

```bash
cd web/frontend
node scripts/claude-create-issue.js "Titel" "Beschreibung" [category] [priority] [labels] [status]

# Beispiel
node scripts/claude-create-issue.js "🔊 Sound Toggle" "Toggle im Header" feature low "enhancement,ux" open
```

**Defaults:** category=feature, priority=medium, status=open

**Batch:** Editiere `claude-create-issue-batch.js` + ausführen

## 🎯 DegixDAW Vision

**Fokus:** Bridge für eigene kreative Arbeit - Musiker/Producer/Songwriter verbinden

**Core Features (Phase 1):**
1. Track Upload & Versioning (GitHub für Audio)
2. Timestamp-Comments (Feedback direkt im Audio)
3. VST3 Plugin (JUCE) - DAW ↔ Cloud Bridge
4. Integrierte Plattform (kein Tool-Switching)

**Tech Stack:**
- Frontend: React 19 + TypeScript + Vite
- Backend: Express + Supabase
- Desktop: C++ Win32
- VST: JUCE Framework

**Datenbank:** 8 neue Tabellen (projects, tracks, midi_events, mixdowns, presets, comments, versions, collaborators)

## Wichtige Docs

**Vollständige Frontend-Doku:** [web/frontend/CLAUDE.md](web/frontend/CLAUDE.md)

**Architektur:**
- [docs/architecture/00_BIG_PICTURE.md](docs/architecture/00_BIG_PICTURE.md) - Vision & Roadmap
- [docs/architecture/02_DATABASE_SCHEMA.md](docs/architecture/02_DATABASE_SCHEMA.md) - SQL Schema
- [docs/architecture/06_DEPLOYMENT.md](docs/architecture/06_DEPLOYMENT.md) - Deployment

**Migrations:** [docs/architecture/migrations/](docs/architecture/migrations/) (✅ DONE)

## Known Issues

**ISSUES.md:** 30 Issues (16 Open, 2 In Progress, 12 Done, 11 Urgent)

**Code TODOs:** 24 TODOs nicht in ISSUES.md

**Console.logs:** 303 Vorkommen in 74 Files (Cleanup empfohlen)
