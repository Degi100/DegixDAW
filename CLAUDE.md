# CLAUDE.md

Diese Datei bietet Anleitungen für Claude Code bei der Arbeit mit dem DegixDAW Monorepo.

## Monorepo-Struktur

```
DegixDAW/
├── web/
│   ├── frontend/        # React 19 + TypeScript (Port 5173)
│   └── backend/         # Express API (Port 3001)
├── desktop/             # C++ Desktop App (MSVC)
│   ├── src/             # C++ Source Files
│   ├── compile.bat      # Build Script (F5)
│   └── build/           # Build Output
├── vst-plugin/          # JUCE VST3 Plugin (geplant)
│   ├── Source/          # C++ VST Code
│   └── CMakeLists.txt   # JUCE Build Config
├── docs/
│   └── architecture/    # Architektur-Dokumentation
│       ├── 00_BIG_PICTURE.md        # Vision & Roadmap
│       ├── 01_SYSTEM_OVERVIEW.md    # Komponenten & Tech Stack
│       ├── 02_DATABASE_SCHEMA.md    # SQL Schema
│       ├── 03_DATA_FLOW.md          # User Journeys
│       ├── 04_STORAGE_STRATEGY.md   # File Storage & RLS
│       ├── 05_VST_PLUGIN.md         # JUCE Architektur
│       ├── 06_DEPLOYMENT.md         # CI/CD & Production
│       └── migrations/              # SQL Migrations
│           ├── README.md            # Migration Guide
│           ├── 001_create_tables.sql    # ✅ DONE
│           ├── 002_create_indexes.sql   # ✅ DONE
│           └── 003_create_triggers.sql  # ✅ DONE
├── packages/
│   ├── types/           # Shared TypeScript Types
│   ├── utils/           # Shared Utilities
│   └── constants/       # Shared Constants
├── netlify.toml         # Netlify Deploy Config
└── package.json         # npm workspaces root
```

## Entwicklungsbefehle (Root)

### Parallele Entwicklung
```bash
npm run dev:all          # Frontend + Backend gleichzeitig
npm run dev:frontend     # Nur Frontend (Port 5173)
npm run dev:backend      # Nur Backend (Port 3001)
```

### Building
```bash
npm run build:all        # Alle Workspaces bauen
npm run build:frontend   # Frontend bauen
npm run build:backend    # Backend bauen
```

### Testing & Linting
```bash
npm run lint:all         # Alle Workspaces linting
npm run test:frontend    # Frontend Tests
```

### Installation
```bash
npm install              # Installiert Root + alle Workspaces
npm run install:all      # Manuell alle installieren
npm run clean            # Alle node_modules löschen
```

## Workspace-Details

### Web Frontend ([web/frontend/](web/frontend/))

React 19 + TypeScript Webanwendung. **Siehe [web/frontend/CLAUDE.md](web/frontend/CLAUDE.md) für vollständige Frontend-Dokumentation.**

**Wichtigste Features:**
- Supabase Auth + Realtime Chat
- Admin-Panel mit Role-System
- Feature Flags System
- Issues Tracking
- Social Features

**Befehle:**
```bash
cd web/frontend
npm run dev              # Vite Dev Server
npm run build            # Production Build
npm run lint             # ESLint
npm test                 # Jest Tests
```

**Environment:**
```env
# web/frontend/.env.local
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_SUPER_ADMIN_EMAIL=...
```

### Web Backend ([web/backend/](web/backend/))

Express API Server mit Supabase Integration.

**Features:**
- RESTful API
- CORS Configuration
- Health Monitoring
- Supabase Integration

**Befehle:**
```bash
cd web/backend
npm run dev              # tsx watch (Hot Reload)
npm run build            # TypeScript Build
npm start                # Production Server
```

**Environment:**
```env
# web/backend/.env
PORT=3001
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
FRONTEND_URL=http://localhost:5173
```

### Shared Packages ([packages/](packages/))

**@degixdaw/types**: TypeScript Interfaces
```typescript
import { User, Message } from '@degixdaw/types';
```

**@degixdaw/utils**: Utilities
```typescript
import { formatTimestamp, debounce } from '@degixdaw/utils';
```

**@degixdaw/constants**: Constants
```typescript
import { USER_ROLES, FEATURES } from '@degixdaw/constants';
```

## Wichtige Entwicklungsmuster

### Cross-Workspace Development

**Frontend nutzt Backend API:**
```typescript
// web/frontend/src/lib/api.ts
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

fetch(`${API_URL}/api/users`);
```

**Shared Types verwenden:**
```typescript
// web/frontend/src/hooks/useAuth.ts
import type { User } from '@degixdaw/types';
```

### Workspace-spezifische Commands

```bash
# Spezifischen Workspace targeten
npm run dev --workspace=web/frontend
npm run build --workspace=web/backend
npm install axios --workspace=web/backend
```

### Neue Dependencies hinzufügen

```bash
# Frontend dependency
npm install react-query --workspace=web/frontend

# Backend dependency
npm install express-rate-limit --workspace=web/backend

# Shared package dependency
npm install date-fns --workspace=packages/utils
```

## Git Workflow

**Branch-Strategie:**
- `main`: Production (deployed)
- `develop`: Integration Branch
- `feature/*`: Feature Branches

**Vor jedem Merge zu `main`:**
```bash
npm run build:all        # Alle Workspaces bauen
npm run lint:all         # Alle linting
npm run test:frontend    # Tests ausführen
```

**Commit-Konventionen:**
```
feat(frontend): add user profile page
fix(backend): resolve CORS issue
chore(packages): update shared types
docs(readme): update monorepo structure
```

## Troubleshooting

### Port bereits in Verwendung

**Frontend (5173):**
```bash
# web/frontend/vite.config.ts hat strictPort: true
# Prozess beenden oder Port ändern
```

**Backend (3001):**
```bash
# Ändere PORT in web/backend/.env
```

### Workspace Dependencies nicht gefunden

```bash
# Root neu installieren
npm install

# Oder manuell alle Workspaces
npm run install:all
```

### TypeScript Build-Fehler

```bash
# Einzelne Workspaces prüfen
cd web/frontend && npm run build
cd web/backend && npm run build
```

### Shared Package ändern

```bash
# Nach Änderungen in packages/*:
# 1. Workspace neu bauen
cd packages/types && npm run build

# 2. Consuming Workspace refreshen (optional)
cd web/frontend && npm install
```

### Desktop App ([desktop/](desktop/))

C++ Desktop-Anwendung mit Windows GUI.

**Features:**
- Native Windows App (Win32 API)
- Supabase Auth Integration
- File Browser
- Credential Storage

**Kompilieren:**
```bash
# Option 1: Mit Batch Script (empfohlen)
cd desktop
compile.bat              # Oder F5 auf Tastatur-Makro

# Option 2: Mit Visual Studio
# Öffne DegixDAW-Desktop.sln in Visual Studio
```

**Ausgabe:**
```
desktop/build/DegixDAW.exe
```

**Hinweis:**
- Automatisches Finden aller `.cpp` Dateien
- MSVC Compiler erforderlich (Visual Studio 2022)
- Build-Fehler in ROT, Erfolg in GRÜN

## Deployment

**Frontend:** Netlify
- Build Command: `npm run build:frontend`
- Publish Directory: `web/frontend/dist`
- Config: `netlify.toml` (automatisch erkannt)

**Backend:** Railway/Render
- Build Command: `npm run build:backend`
- Start Command: `npm start --workspace=web/backend`

**Desktop:** Lokale Builds
- Windows: `compile.bat`
- Ausgabe: `desktop/build/DegixDAW.exe`

**Environment Variables:** Separate für Frontend/Backend setzen!

## GitHub Actions & CI/CD

### Required GitHub Secrets

Für die Daily Analytics Snapshots (`.github/workflows/daily-snapshot.yml`):

```
VITE_SUPABASE_URL           # Deine Supabase Project URL
SUPABASE_SERVICE_ROLE_KEY   # Supabase Service Role Key (NICHT Anon Key!)
```

**Setup:**
1. Gehe zu Repository Settings → Secrets and variables → Actions
2. Klicke auf "New repository secret"
3. Füge beide Secrets hinzu

**Test:**
```bash
# Manuell triggern via GitHub UI:
# Actions → Daily Analytics Snapshot → Run workflow
```

### Workflow Status

- ✅ **Daily Snapshot**: Läuft täglich um 00:00 UTC (1:00 CET / 2:00 CEST)
- 📊 **Metrics**: LOC, Files, Commits, Users, Messages, Issues
- 🔄 **Manual Trigger**: Via GitHub Actions UI möglich

## 🎯 DegixDAW Vision & Alleinstellungsmerkmale

**Was macht DegixDAW einzigartig?**

DegixDAW ist eine **All-in-One Musikerplattform** für asynchrone Kollaboration. NICHT für Real-time Jamming (technisch unmöglich wegen Latency), sondern für **Producer-Workflow mit DAW-Integration**.

### Core Features (Unique Selling Points)

1. **VST3 Plugin** (JUCE) - Bridge zwischen DAW und Cloud
   - Login im Plugin (OAuth2)
   - Projekte aus Cloud laden → direkt in Cubase/Ableton/Logic
   - Mixdowns aus DAW hochladen
   - Preset-Management

2. **Browser-basierter MIDI/Audio Editor** (Tone.js + Web MIDI API)
   - Piano Roll im Browser
   - MIDI-Events editieren
   - Playback mit Tone.js
   - Speichern in Supabase

3. **Preset & Mixdown Sharing**
   - Producer teilt Preset mit Mix Engineer
   - Mix Engineer lädt in DAW (via VST Plugin)
   - Mixdown zurück hochladen
   - Producer streamed finales Ergebnis

4. **Integrierte Plattform** (kein Slack, Discord, Dropbox nötig)
   - Chat + Social + Musik-Features in einem
   - Kein Context-Switching zwischen Tools

### Tech Stack

**Frontend:**
- React 19 + TypeScript + Vite
- Tone.js (MIDI Playback & Synthesis)
- Web MIDI API (Keyboard Input)

**Backend:**
- Supabase (PostgreSQL + Storage + Auth + Realtime)
- Row-Level Security (RLS) für alle Zugriffe
- Signed URLs (1h expiry) für private Files

**VST Plugin:**
- JUCE Framework (C++17)
- VST3 SDK
- OAuth2 Flow
- HTTP Client für Supabase API

**Desktop App:**
- C++ Win32 (Windows)
- Supabase Integration
- File Browser

### Datenbank-Status

✅ **Migration Complete** (15 MB → 17 MB)

**8 neue Tabellen:**
- `projects` - Musik-Projekte
- `project_collaborators` - Kollaboratoren (Owner/Editor/Viewer)
- `tracks` - Audio/MIDI/Bus/FX Tracks
- `midi_events` - MIDI Note On/Off Events
- `mixdowns` - Finale Audio-Mixdowns
- `presets` - VST/Synth Presets
- `track_comments` - Track-Kommentare mit Timestamps
- `project_versions` - Versionshistorie

**23 Performance-Indexes** (z.B. für creator_id, project_id, timestamp_ms)

**6 Auto-Update Triggers** (updated_at, search_vector)

**Alte Tabellen unberührt:** profiles, messages, conversations, issues, etc.

### Entwicklungsstand

**Gesamt: ~20%**

- ✅ Chat & Auth: 60%
- ✅ Social Features: 40%
- ✅ Admin Panel: 80%
- ✅ Database Schema: 100% (Migration done!)
- Desktop App: 3%
- MIDI Editor: 0% (User hat 5 Jahre alte Erfahrung damit)
- VST Plugin: 5% (User hat JUCE "Hello World" getestet)

### Roadmap

**PoC Phase (8 Wochen):**
1. MIDI Editor v1 (Piano Roll + Tone.js)
2. VST Plugin v1 (Login + Project List)
3. Projekt Download (Cloud → DAW)
4. Mixdown Upload (DAW → Cloud)

**MVP Phase (12 Wochen):**
- Multi-Track Editor
- Audio Recording im Browser
- Preset Browser + Search
- Collaboration Features

**Production (12+ Wochen):**
- Mobile App (React Native)
- macOS VST Build
- Monetization (Pro Features)

## Nächste Schritte

### Sofort (Nach diesem Commit)

1. ⏳ Branch erstellen: `feat/music-database-schema`
2. ⏳ Commit: Architecture docs + Database migrations
3. ⏳ `nul` File löschen (Windows-Bug)

### Entwicklungsphase

**Option A: MIDI Editor zuerst** (empfohlen)
- User hat bereits Erfahrung damit (5 Jahre alt)
- Tone.js Integration
- Piano Roll UI
- Speichern in neue `projects` Tabelle

**Option B: VST Plugin zuerst**
- User hat JUCE bereits getestet
- SupabaseClient bauen
- OAuth2 Flow implementieren
- Project List laden

**Entscheidung:** Nutzer wählt!

## Weitere Dokumentation

### Monorepo Docs
- [Root README.md](README.md): Monorepo Overview
- [web/frontend/CLAUDE.md](web/frontend/CLAUDE.md): Frontend Details
- [web/backend/README.md](web/backend/README.md): Backend Details
- [desktop/README.md](desktop/README.md): Desktop App Details
- [netlify.toml](netlify.toml): Netlify Deployment Config

### Architektur Docs (NEU!)
- [docs/architecture/00_BIG_PICTURE.md](docs/architecture/00_BIG_PICTURE.md): Vision & Roadmap
- [docs/architecture/01_SYSTEM_OVERVIEW.md](docs/architecture/01_SYSTEM_OVERVIEW.md): Komponenten
- [docs/architecture/02_DATABASE_SCHEMA.md](docs/architecture/02_DATABASE_SCHEMA.md): SQL Schema
- [docs/architecture/03_DATA_FLOW.md](docs/architecture/03_DATA_FLOW.md): User Journeys
- [docs/architecture/04_STORAGE_STRATEGY.md](docs/architecture/04_STORAGE_STRATEGY.md): File Storage
- [docs/architecture/05_VST_PLUGIN.md](docs/architecture/05_VST_PLUGIN.md): JUCE Architektur
- [docs/architecture/06_DEPLOYMENT.md](docs/architecture/06_DEPLOYMENT.md): CI/CD

### Migration Docs
- [docs/architecture/migrations/README.md](docs/architecture/migrations/README.md): Step-by-Step Guide
- [docs/architecture/migrations/001_create_tables.sql](docs/architecture/migrations/001_create_tables.sql): ✅ Executed
- [docs/architecture/migrations/002_create_indexes.sql](docs/architecture/migrations/002_create_indexes.sql): ✅ Executed
- [docs/architecture/migrations/003_create_triggers.sql](docs/architecture/migrations/003_create_triggers.sql): ✅ Executed

## Known Issues & Cleanup

**ISSUES.md:** 30 Issues (16 Open, 2 In Progress, 12 Done, 11 Urgent)

**Code TODOs:** 24 TODOs nicht in ISSUES.md

**Console.logs:** 303 Vorkommen in 74 Files (Cleanup empfohlen)

**Windows Bug:** `nul` File im Root → Löschen + `.gitignore`
