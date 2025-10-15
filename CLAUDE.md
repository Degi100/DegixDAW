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

## Nächste Schritte

1. ✅ **Desktop App**: C++ Desktop App mit Windows GUI (fertig)
2. **VST Plugins**: JUCE Framework Integration
3. **CI/CD**: GitHub Actions für alle Workspaces
4. **Monorepo Tools**: Optional Turborepo/Nx für Caching

## Weitere Dokumentation

- [Root README.md](README.md): Monorepo Overview
- [web/frontend/CLAUDE.md](web/frontend/CLAUDE.md): Frontend Details
- [web/backend/README.md](web/backend/README.md): Backend Details
- [desktop/README.md](desktop/README.md): Desktop App Details
- [netlify.toml](netlify.toml): Netlify Deployment Config
