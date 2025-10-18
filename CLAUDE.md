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

### 🔥 Claude Code-Qualität Regeln (SEHR WICHTIG!)

**1. Monolith vermeiden - Clean Code schreiben!**
- Keine Files >400 Zeilen (Split in Components/Hooks/Utils)
- DRY Prinzip: Config-Arrays statt Copy-Paste (siehe GrowthChart `CHART_METRICS`)
- Component Extraction bei >2x Duplikation
- Custom Hooks für Data/Actions trennen

**2. Folder-Struktur strikt einhalten!**
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

**3. SCSS verwenden - Inline-Styling nur wenn zwingend nötig!**
```tsx
// ✅ GOOD: CSS Variables für dynamische Werte
<line stroke={`var(--metric-color)`} />

// ✅ OK: Library-Props (Recharts hat keine className-API)
<Line strokeWidth={2} dot={false} />

// ❌ BAD: Inline-Styles ohne Grund
<div style={{ color: 'red', fontSize: '14px' }}>...</div>
```

**4. Dev-Server NIEMALS manuell starten!**
```bash
# ❌ FALSCH - Claude startet NICHT:
npm run dev
npm run api

# ✅ RICHTIG - Läuft bereits via npm run dev:all
# Falls NICHT running → Claude fragt User ZUERST:
# "Dev-Server läuft nicht. Soll ich `npm run dev:all` ausführen?"
```

**Warum wichtig:**
- User hat Server bereits laufen (Standard-Workflow)
- Claude's restart = Duplicate Processes (Port-Conflicts!)
- **Vor Start:** Immer `BashOutput` checken oder User fragen!

**5. 🚨 NIEMALS auf `main` Branch arbeiten!**
```bash
# ✅ VOR JEDER Code-Änderung: Branch prüfen!
git branch --show-current

# Wenn Output = "main":
# ❌ STOPP! Keine Änderungen!
# ✅ User fragen: "Du bist auf main. Soll ich einen Feature-Branch erstellen?"

# ✅ RICHTIG: Immer auf Feature-Branch
git checkout -b feat/mein-feature
# Oder auf develop
git checkout develop
```

**Regel:**
- **KEINE Änderungen** auf `main` ohne explizite User-Bestätigung!
- **VOR jedem Edit/Write:** `git branch --show-current` prüfen
- **Falls `main`:** User fragen + Feature-Branch vorschlagen
- **Exception:** User sagt explizit "mach auf main"

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

## 📊 Analytics System - Wie es funktioniert

**WICHTIG:** Das Analytics-System hat **ZWEI verschiedene LOC-Quellen**!

### 🔴 LIVE LOC (StatsGrid Kachel "📝 Lines of Code")

**Was du siehst:**
- Admin-Panel → Analytics → Kachel "Lines of Code"
- Zeigt **LIVE** Zahlen (aktuell aus Git)

**Wie es funktioniert:**
```
Frontend (AdminAnalytics.tsx)
  ↓
  useAnalytics() Hook
  ↓
  metricsService.getProjectMetrics()
  ↓
  codeMetricsService.getCodeMetrics()  ← Ruft Backend API!
  ↓
  fetch('http://localhost:3001/api/analytics/code-metrics')
  ↓
Backend (web/backend/src/index.ts)
  ↓
  Git Commands (git ls-files, git rev-list, etc.)
  ↓
  Zählt LOC, Files, Commits LIVE
  ↓
  Return JSON zu Frontend
```

**Code-Location:**
- Frontend: `web/frontend/src/lib/services/analytics/codeMetricsService.browser.ts`
- Backend: `web/backend/src/index.ts` (Zeile 38-194)

**Fallback wenn Backend offline:**
```typescript
// codeMetricsService.browser.ts (Zeile 40-48)
return {
  loc: 46721,        // ← FAKE "Default" Wert!
  files: 435,
  commits: 234,
  projectAge: { days: 17, startDate: '2025-09-24' }
};
```

**Problem in Production:**
- Backend läuft nur auf `localhost:3001` (Development)
- In Production (Vercel/Netlify) → Backend nicht verfügbar
- → Frontend zeigt **Fallback-Werte (46.721 LOC)** statt echte Zahlen!

**Lösung:**
1. Backend auf **Render.com** deployen (kostenlos, 750h/Monat)
2. Frontend ENV updaten: `VITE_BACKEND_URL=https://degixdaw-backend.onrender.com`
3. `codeMetricsService.browser.ts` nutzt Production-URL

---

### 🟢 CHART LOC (GrowthChart mit Snapshots)

**Was du siehst:**
- Admin-Panel → Analytics → Chart "📈 Growth Timeline"
- Zeigt **historische** Snapshots (täglich von GitHub Actions)

**Wie es funktioniert:**
```
GitHub Actions (täglich 00:00 UTC)
  ↓
  .github/workflows/daily-snapshot.yml
  ↓
  web/frontend/scripts/analytics/create-snapshot-github-actions.js
  ↓
  Git Commands (KOSTENLOS! Kein API!)
  ↓
  Zählt LOC, Files, Commits, Language-Breakdown
  ↓
  Schreibt in Supabase (project_snapshots Tabelle)
  ↓
Frontend (GrowthChart.tsx)
  ↓
  snapshotsService.getSnapshots(30)  ← Lädt letzte 30 Snapshots
  ↓
  Supabase Query (SELECT * FROM project_snapshots)
  ↓
  Chart zeigt historische Daten (z.B. 93.793 LOC am neuesten Tag)
```

**Code-Location:**
- GitHub Actions: `.github/workflows/daily-snapshot.yml`
- Snapshot-Script: `web/frontend/scripts/analytics/create-snapshot-github-actions.js`
- Frontend Service: `web/frontend/src/lib/services/analytics/snapshotsService.ts`
- Chart Component: `web/frontend/src/components/admin/analytics/GrowthChart.tsx`

**Warum Chart andere LOC zeigt als Kachel:**

| Quelle | LOC | Grund |
|--------|-----|-------|
| **LIVE Kachel** | 46.721 (Fallback) | Backend offline → Fake-Wert |
| **Chart Snapshot** | 93.793 (echt) | GitHub Actions zählt **komplettes Repo** (inkl. `web/`, `desktop/`, `docs/`) |

**Unterschied:**
- **Lokales Backend**: Zählt nur ab `web/frontend/` + `web/backend/` (wegen Path-Logic)
- **GitHub Actions**: Zählt **Root-Verzeichnis** (komplettes Repo)

---

### 🎯 "📸 Snapshot" Button im Admin-Panel

**Was passiert aktuell:**
```typescript
// AdminAnalytics.tsx (Zeile 128)
const handleCreateSnapshot = async () => {
  const snapshot = await createSnapshot();  // ← snapshotsService.createSnapshot()
}

// snapshotsService.ts
export async function createSnapshot() {
  const metrics = await getProjectMetrics();  // ← Holt nur DB-Metrics (Users, Messages, Issues)
  // LOC fehlt! (Kein Git im Browser)
  await supabase.from('project_snapshots').insert({ ...metrics });
}
```

**Problem:**
- Frontend kann **KEINE Git-Commands** ausführen → LOC fehlt!
- Snapshot enthält nur: Users, Messages, Issues (OHNE Code-Metriken)

**Warum Backend gebraucht wird:**
- Backend kann Git-Commands ausführen
- "📸 Snapshot" Button soll **kompletten Snapshot** (inkl. LOC) erstellen
- **ABER:** Backend läuft nur lokal → In Production nicht verfügbar!

**Lösungen:**

1. **Render.com Backend** (⭐ Empfohlen):
   - Deploy Backend auf Render.com (kostenlos)
   - Frontend ruft Render-URL statt localhost
   - "📸 Snapshot" Button funktioniert in Production

2. **GitHub Actions Workflow Dispatch**:
   - "📸 Snapshot" Button triggert GitHub Actions via API
   - Nutzt existierendes Script (kein Backend nötig!)
   - 100% kostenlos

3. **Supabase Edge Function** (Umbau erforderlich):
   - Edge Function hat **kein Git** → Muss GitHub API nutzen statt Git-Commands
   - Aufwendiger Umbau (~30min)

---

### 📋 Zusammenfassung (Für Claude!)

**Wenn du Analytics-Zahlen siehst, beachte:**

1. **Kachel LOC ≠ Chart LOC** ist NORMAL!
   - Kachel = LIVE (Backend API oder Fallback)
   - Chart = Snapshots (GitHub Actions)

2. **Fallback-Wert 46.721** bedeutet:
   - Backend nicht erreichbar
   - In Development: `npm run dev:backend` fehlt
   - In Production: Backend nicht deployed

3. **Chart zeigt echte Zahlen** (z.B. 93.793):
   - Kommt von GitHub Actions Snapshots
   - Läuft täglich automatisch
   - Zählt komplettes Repo (mehr Files als lokales Backend)

4. **Backend ist WICHTIG für:**
   - LIVE LOC in Kachel (ohne Fallback)
   - "📸 Snapshot" Button (manueller Snapshot)

5. **Deployment-Status:**
   - ❌ Backend: Nur lokal (`localhost:3001`)
   - ✅ Frontend: Vercel/Netlify
   - ✅ GitHub Actions: Läuft täglich
   - ✅ Supabase: Snapshots gespeichert

**Dokumentation:**
- Vollständige Doku: `web/frontend/docs/ANALYTICS_SYSTEM.md`
- Backend Code: `web/backend/src/index.ts` (Analytics Endpoint)
- GitHub Actions: `.github/workflows/daily-snapshot.yml`

---

## 🐛 Claude Issue Creation - Wie es funktioniert

**WICHTIG:** Issues schnell und einfach erstellen via CLI!

### ✅ **Single Issue erstellen (CLI)**

```bash
cd web/frontend
node scripts/claude-create-issue.js "Titel" "Beschreibung" [category] [priority] [labels] [status]
```

**Beispiele:**
```bash
# Minimal (nutzt Defaults: category=feature, priority=medium, status=open)
node scripts/claude-create-issue.js "🔊 Sound Toggle" "Toggle im Header"

# Komplett
node scripts/claude-create-issue.js "🔊 Sound Toggle" "Toggle im Header neben Darkmode" feature low "enhancement,ux" open
```

**Defaults:**
- `category`: `feature`
- `priority`: `medium`
- `labels`: `` (leer)
- `status`: `open`

**Script-Location:** `web/frontend/scripts/claude-create-issue.js`

---

### 🔄 **Batch Issues erstellen**

Für mehrere Issues auf einmal → Editiere `web/frontend/scripts/claude-create-issue-batch.js`:

```javascript
const issues = [
  { title: '...', description: '...', category: 'refactoring', priority: 'high', labels: ['refactoring'], status: 'open' },
  { title: '...', description: '...', category: 'feature', priority: 'medium', labels: ['enhancement'], status: 'open' }
];
```

```bash
cd web/frontend
node scripts/claude-create-issue-batch.js
```

---

### �� **Wie es technisch funktioniert**

**1. RPC Function für User-ID Lookup:**
```sql
-- web/frontend/scripts/sql/get_user_id_by_email.sql
CREATE OR REPLACE FUNCTION get_user_id_by_email(user_email TEXT)
RETURNS UUID AS $$
  SELECT p.id FROM auth.users u
  JOIN profiles p ON p.id = u.id
  WHERE u.email = user_email LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;
```

**2. Script nutzt Service Role Key:**
```javascript
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY  // Bypasses RLS!
);

// Get User ID via RPC
const { data: userId } = await supabase.rpc('get_user_id_by_email', {
  user_email: process.env.VITE_SUPER_ADMIN_EMAIL
});

// Insert Issue
await supabase.from('issues').insert({
  title, description, category, priority, labels, status,
  created_by: userId  // Required!
});
```

**3. Environment Variables (Required):**
```env
# web/frontend/.env
VITE_SUPABASE_URL=https://...
VITE_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...  # Für Issue-Creation!
VITE_SUPER_ADMIN_EMAIL=...     # Für User-ID Lookup
```

---

### ⚠️ **Wichtige Regeln für Claude**

**Issue-Text:** Kurz und knackig!
```
✅ GOOD: "688 Zeilen, 11x useState\nExtract: Components + Hooks + Utils"
❌ BAD:  "This is a very long description explaining in detail what..."
```

**Titles:** Max 50 Zeichen, Emoji OK
```
✅ GOOD: "🔊 Sound Toggle Button im Header"
❌ BAD:  "Implement a comprehensive sound notification toggle system..."
```

**Labels:** Komma-separiert
```bash
# Korrekt
node scripts/claude-create-issue.js "Title" "Desc" feature low "enhancement,ux,public" open

# NICHT mit Spaces!
"enhancement, ux"  # ❌ Falsch → 3 Labels: "enhancement", " ux"
```

---

### 📋 **Verfügbare Optionen**

**Categories:**
- `feature`, `bug`, `refactoring`, `docs`, `testing`, `enhancement`

**Priorities:**
- `low`, `medium`, `high`, `critical`

**Status:**
- `open`, `in_progress`, `done`, `closed`

**Labels (Beispiele):**
- `bug`, `feature`, `urgent`, `docs`, `enhancement`, `question`, `refactoring`, `ux`, `public`

---

### 🎯 **Nächstes Mal wenn du Issues willst:**

1. **Ein Issue:** One-Liner ausführen
2. **Mehrere Issues:** Batch-Script editieren + ausführen
3. **Kein manuelles Kopieren** mehr nötig!

**Fertig in 5 Sekunden!** 🎉

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
