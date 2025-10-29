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

## 📚 Ausführliche Feature-Dokumentation

**WICHTIG:** Alle Features haben eigene detaillierte Dokumentation! Bevor du Code schreibst, lies ZUERST die entsprechende Doku!

### Core Features

#### 🚩 Feature Flags System (v2.0 - Supabase Backend)
**Datei:** [web/frontend/docs/FEATURE_FLAGS.md](web/frontend/docs/FEATURE_FLAGS.md) (540 Zeilen, 14 KB)

**Was es ist:**
- Supabase-Backend mit `feature_flags` Tabelle (NICHT mehr in-memory!)
- Realtime Updates via Supabase Realtime
- Role-Based Access mit JSONB `allowed_roles` Array
- Admin Panel bei `/admin/features`

**Key Points:**
- DB Schema mit RLS Policies (Everyone read, Admins write)
- Categories: core, chat, files, cloud, admin
- Helper Function: `can_access_feature(p_feature_id TEXT, p_user_id UUID)`
- Migration Guide v1.0 → v2.0 enthalten

**Setup:**
```bash
cd web/frontend/scripts/sql
# Execute feature_flags_setup.sql in Supabase SQL Editor
```

---

#### 📂 File Browser (v2.0 - Floating Window + Projects Integration)
**Datei:** [web/frontend/docs/FILE_BROWSER.md](web/frontend/docs/FILE_BROWSER.md) (730 Zeilen, 28 KB)

**Was es ist:**
- Floating Window Mode (draggable, pinnable, minimizable via React Portal)
- Add-to-Project Button für Audio-Files
- `user_files` Tabelle für zentrale Datei-Verwaltung
- Automatische Waveform-Generation beim Add-to-Project

**Key Components:**
- `FloatingFileBrowserContainer.tsx` - Portal Wrapper + Drag Logic
- `AddToProjectButton.tsx` - Projects Integration (Chat → shared_files → Tracks)
- `useFloatingFileBrowser.ts` - State Management mit LocalStorage
- `userFilesService.ts` - File Move + Project Add Logic

**Key Points:**
- Route Persistence (bleibt offen beim Page-Wechsel)
- Code Refactoring: 688 LOC → 214 LOC
- Realtime Sync via Supabase
- `source_project_ids` JSONB Array für Multi-Project-Usage

---

#### 🐛 Issues System
**Datei:** [web/frontend/docs/ISSUES_SYSTEM.md](web/frontend/docs/ISSUES_SYSTEM.md)

**Was es ist:**
- GitHub-style Issue Tracking im Admin Panel
- Categories: feature, bug, refactoring, docs, testing, enhancement
- Priorities: low, medium, high, critical
- CLI Scripts für schnelles Erstellen (siehe "Claude Issue Creation" Abschnitt in CLAUDE.md)

**CLI Usage:**
```bash
cd web/frontend
node scripts/claude-create-issue.js "Titel" "Beschreibung" [category] [priority] [labels]
```

---

#### 📊 Analytics System
**Datei:** [web/frontend/docs/ANALYTICS_SYSTEM.md](web/frontend/docs/ANALYTICS_SYSTEM.md) (28 KB)

**Was es ist:**
- **LIVE LOC**: Backend API (Git Commands) → Admin-Panel Kachel
- **Chart LOC**: GitHub Actions Snapshots (täglich 00:00 UTC) → GrowthChart
- Daily Snapshots via `.github/workflows/daily-snapshot.yml`

**WICHTIG:**
- Kachel LOC ≠ Chart LOC ist NORMAL!
- Fallback-Wert 46.721 = Backend offline
- Chart zeigt echte Snapshots (z.B. 93.793 LOC)

**Deployment:**
- Backend: Nur lokal (`localhost:3001`) - Render.com empfohlen für Production
- GitHub Actions: Läuft täglich automatisch
- Supabase: `project_snapshots` Tabelle

---

#### 👥 Admin Role System
**Datei:** [web/frontend/scripts/sql/ADMIN_ROLE_SYSTEM.md](web/frontend/scripts/sql/ADMIN_ROLE_SYSTEM.md)

**Was es ist:**
- Supabase `raw_user_meta_data->>'is_admin'` für Role-Check
- Admin Panel bei `/admin` (Route-Guard)
- User Management im Admin Panel

**Setup:**
```sql
-- Set Super Admin
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(raw_user_meta_data, '{is_admin}', 'true')
WHERE email = 'your-email@example.com';
```

---

#### 🗄️ Storage & RLS
**Datei:** [web/frontend/scripts/sql/STORAGE_SETUP.md](web/frontend/scripts/sql/STORAGE_SETUP.md)

**Was es ist:**
- Supabase Storage Buckets mit RLS Policies
- `chat-attachments`: 5 MB Limit, Authenticated Users
- `shared_files`: Für Projects, User-Owned Files
- Signed URLs (1h expiry) für private Files

---

#### 💬 Chat System (v1.0 - Realtime + Sounds + Presence)
**Datei:** [web/frontend/docs/CHAT_SYSTEM.md](web/frontend/docs/CHAT_SYSTEM.md) (450+ Zeilen, 20 KB)

**Was es ist:**
- Vollständiges Realtime-Messaging-System mit Supabase Realtime
- Direct Messages + Group Chats
- Sound-Benachrichtigungen (Web Audio API, 5 Sounds)
- Online Status Tracking (Supabase Presence)
- Pinned Conversations (Sort Logic)

**Key Features:**
- ✅ **Sound System**: Toggle im Header (🔊/🔇), LocalStorage Persistence
- ✅ **Online Status Hook**: `useOnlineStatus()` - Supabase Presence API
- ✅ **Pinned Conversations**: `is_pinned` Column + Sort Logic
- ✅ **File Attachments**: Images, Audio, Video, Docs (5 MB Limit)
- ✅ **Speech-to-Text**: 🎤 Button, 40+ Sprachen
- ❌ **Typing Indicator**: Hook fehlt (To-Do)
- ❌ **Pinned Messages**: Nur Conversations, nicht Messages (To-Do)
- ❌ **Online Badge UI**: Hook existiert, UI fehlt (To-Do)

**Key Components:**
- `ChatSidebar.tsx` - Main Sidebar (214 LOC - refactored!)
- `useOnlineStatus.ts` - Online Status Hook
- `chatSounds.ts` - Sound Manager (Web Audio API)
- `ConversationList.tsx` - Pinned Sort Logic

**Database:**
- `messages` - Message Storage + Reply-to + Edit/Delete
- `conversations` - Direct/Group Chats + is_pinned
- `conversation_members` - Members + Roles + last_read_at
- `message_attachments` - File Uploads

---

### 🎯 Wie du die Dokus nutzt (SEHR WICHTIG!)

**REGEL:**
1️⃣ **ZUERST**: Lies die Doku-Datei (z.B. FEATURE_FLAGS.md)
2️⃣ **DANN**: Lies den Code (falls noch unklar)
3️⃣ **NIEMALS**: Code schreiben ohne Doku zu lesen!

**Warum?**
- ⚡ **Schneller**: Doku lesen = 2 Minuten, Code scannen = 10 Minuten
- 🧠 **Kontext**: Doku erklärt WIE und WARUM, Code nur WAS
- ✅ **Korrekt**: Verhindert Duplicate Code, falsche Patterns, veraltete Ansätze

**Beispiel:**
```
❌ FALSCH:
User: "Add feature flag for new feature"
Claude: *Scannt Code* → Schreibt in-memory Feature Flag (v1.0 - VERALTET!)

✅ RICHTIG:
User: "Add feature flag for new feature"
Claude: *Liest FEATURE_FLAGS.md* → Nutzt Supabase Backend (v2.0!)
```

---

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

**6. 📚 CLAUDE.md als primäre Wissensquelle nutzen!**

**Die goldene Regel:**
```
Wenn du nach einem Feature/Code/Funktionalität suchst:
1️⃣ ZUERST: CLAUDE.md lesen (Abschnitt "📚 Ausführliche Feature-Dokumentation")
2️⃣ Link zu Doku-File gefunden? → Lese die Doku (z.B. FEATURE_FLAGS.md, CHAT_SYSTEM.md)
3️⃣ Nicht gefunden? → Codebase durchsuchen (Grep, Read, Task Agent)
4️⃣ Gefunden? → FRAGE USER: "Soll ich [Feature] in docs/ dokumentieren + CLAUDE.md updaten?"
5️⃣ User sagt ja? → Erstelle docs/FEATURE_NAME.md + füge Link in CLAUDE.md hinzu!
```

**🔥 WICHTIG: Immer User fragen bevor du dokumentierst!**
- ❌ **NICHT:** Automatisch CLAUDE.md oder docs/ updaten ohne zu fragen
- ✅ **RICHTIG:** "Ich habe Feature X gefunden. Soll ich `docs/FEATURE_X.md` erstellen + in CLAUDE.md verlinken?"
- **Warum?** User will wissen was dokumentiert wird & kann Input geben!

**Warum wichtig:**
- ⚡ **Performance**: CLAUDE.md lesen = 10 Sekunden, Codebase scannen = 2 Minuten
- 🧠 **Kontext**: docs/ erklärt WIE und WARUM, Code zeigt nur WAS
- 🔄 **Wachsende Wissensbasis**: Jede Session macht Dokumentation besser
- 🎯 **Zusammenhänge**: CLAUDE.md zeigt Links zwischen Features
- 📂 **Übersichtlich**: Detaillierte Dokus in eigenen Files (nicht alles in CLAUDE.md!)

**Workflow:**
1. User fragt: *"Was kann Feature X?"*
2. Claude liest CLAUDE.md → Findet Link zu `docs/FEATURE_X.md` ✅
3. Claude liest Doku-File → Antwortet mit Details
4. Nicht dokumentiert? → Suche Code → Frage User → Erstelle Doku
5. Nächste Session: Wissen ist bereits da! 🎉

**Wo dokumentieren:**
- ✅ **CLAUDE.md**: Kurze Übersicht + Link zu detaillierter Doku
- ✅ **web/frontend/docs/**: Ausführliche Feature-Dokumentation (wie FEATURE_FLAGS.md, FILE_BROWSER.md, CHAT_SYSTEM.md)

**Was dokumentieren:**
- ✅ Feature-Funktionalität (Was kann es? Wie nutzt man es?)
- ✅ Code-Locations (Wo liegt der Code? Components/Hooks/Services)
- ✅ Database Schema (Tables, Columns, RLS Policies, Indexes)
- ✅ Code Examples (TypeScript/React Snippets)
- ✅ Use Cases (Wofür wird es genutzt? Beispiele)
- ✅ Known Issues (Bugs, Limitationen, Workarounds)
- ✅ What's Missing (To-Do Features)
- ✅ Changelog (Version History)

**Section für neue Feature-Links:**
→ Ergänze in: `## 📚 Ausführliche Feature-Dokumentation`

**Beispiel:**
```markdown
### 🎯 **[Feature Name]**

**Was ist das?**
Kurze Beschreibung (1-2 Sätze)

**Hauptfunktionen:**
- ✅ Feature 1
- ✅ Feature 2
- 🚧 Feature 3 (teilweise)

**Location:**
- Component: `components/[path]`
- Hook: `hooks/[hook].ts`
- Service: `lib/services/[service].ts`

**Wichtige Hinweise:**
- ⚠️ Caveat 1
- 💡 Tipp 1

**Use Case:**
Beispiel-Szenario wie Feature genutzt wird
```

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

**Updated:** 2025-10-21 - Neue Vision: Fokus auf eigene Kreativität

**Was macht DegixDAW einzigartig?**

DegixDAW ist die **Bridge für eigene kreative Arbeit** - eine Collaboration-Platform die Musiker, Producer und Songwriter verbindet.

**NICHT noch ein BandLab** (keine 20 Mio Stock-Samples), sondern **Fokus auf EIGENE Musik:**
- Singer uploaded eigene Demo
- Songwriter kommentiert Text (Timestamp-Comments)
- Producer lädt Track via VST in DAW
- Musiker uploaded eigene Gitarre dazu
- = Alles eigene Kreativität, keine Generic Loops!

### Entwicklungsstand (v0.1.6)

**Updated:** 2025-10-28 - Komplettes Feature-Audit durchgeführt

**Gesamt: ~30-50%** (Realistisch - Features existieren, aber viele Bugs!)

**WICHTIG:** Fokus = **Bug Fixing & Polishing**, NICHT neue Features bauen!

---

## ✅ **Implementierte Features** (Was funktioniert)

### 🔐 **Auth & Account** (90%)
- ✅ Email/Password Login + OAuth (Google/GitHub)
- ✅ Password Reset & Account Recovery (Multi-Step Wizard)
- ✅ Email Confirmation + Change Email
- ✅ Username Onboarding (für neue User)
- ✅ Admin Recovery (Super Admin kann alle User recovern)
- Location: `pages/auth/`, `pages/account/`, `components/auth/`

### 👤 **User Features** (85%)
- ✅ Public Profile Page (`/profile/:userId`)
- ✅ Avatar System mit **Custom Canvas Image Cropper** (Zoom, Crop, Resize - eigene Implementierung!)
- ✅ User Settings (4 Tabs: Profile, Security, Account, Privacy)
- ✅ Dashboard (Welcome Card, Quick Links, Recent Projects)
- ✅ Privacy Settings (Show Email, Online Status)
- Location: `pages/profile/`, `pages/settings/`, `pages/dashboard/`

### 👥 **Social Features** (75%)
- ✅ Friends & Followers System
- ✅ User Search (Name, Email, Username)
- ✅ Send/Accept/Decline Friend Requests
- ✅ Follow/Unfollow Users
- ✅ Social Stats Display
- Location: `pages/dashboard/Social.tsx`, `components/social/`

### 💬 **Chat System** (85%)
- ✅ Realtime Messaging (Supabase Realtime)
- ✅ Direct Messages + Group Chats
- ✅ File Attachments (Images, Audio, Docs)
- ✅ Unread Count + Read Receipts
- ✅ Chat Sidebar (Collapsible, Feature Flag)
- ✅ Chat Sounds (Toggle on/off)
- ✅ Speech-to-Text Input (🎤 Button, 40+ Languages)
- Location: `pages/chat/`, `components/chat/`, `components/social/`

### 🎵 **Projects & Tracks** (70%)
- ✅ Projects System (CRUD, Settings: BPM/Key/Time Signature)
- ✅ Project Collaborators (Email Invites via Supabase Edge Function)
- ✅ Role-Based Permissions (Viewer, Contributor, Mixer, Admin)
- ✅ Track Upload (WAV/MP3/FLAC, Drag & Drop)
- ✅ Waveform Visualization (Canvas-based)
- ✅ Audio Playback (HTML5 Audio)
- ✅ **Peak Meters** (L/R Stereo, Clipping Detection, dBFS Display) - Professionell!
- ✅ **Sync Playback** (Host/Listener Modes, Realtime Broadcast) - [useSyncPlayback.ts](web/frontend/src/hooks/useSyncPlayback.ts) komplett!
- ✅ Track Comments (Timestamped, Markers auf Waveform, Resolve/Unresolve)
- ✅ BPM Detection (web-audio-beat-detector)
- ✅ Pan Control (-100L bis +100R)
- 🚧 Track Versioning (40% - DB Schema da, Git-Style UI fehlt)
- Location: `pages/projects/`, `components/projects/`, `components/tracks/`, `components/audio/`

### 📁 **File Management** (85%)
- ✅ File Browser (4 Tabs: All, Audio, Images, Documents)
- ✅ **Floating File Browser** (Draggable Window, Pin/Minimize, Route-Persistence) - Unique Feature!
- ✅ File → Projects Integration (Add Chat Files zu Projects, Realtime Sync)
- ✅ Secure File Storage (Supabase Storage + RLS, Signed URLs 1h expiry)
- ✅ Audio Playback, Image Preview
- Location: `pages/files/`, `components/files/`, `contexts/FloatingFileBrowserContext.tsx`

### ⚙️ **Admin Panel** (90%)
- ✅ **Admin Dashboard** (System Health, Stats, Activity Feed)
- ✅ **User Management** (CRUD, Bulk Actions, Role Management, Export CSV/JSON)
- ✅ **Issues Tracking** (CRUD, Comments, Assignment, Filters, CLI Scripts)
- ✅ **Feature Flags** (Toggle Features, Role-Based Access, Realtime Updates)
- ✅ **Analytics** (LOC Chart, Project Metrics, Storage Breakdown, GitHub Actions Daily Snapshots)
- ✅ **Admin Settings** (Application, Security, Notifications, System Info)
- ✅ **Role System** (Super Admin / Admin / Moderator / Beta User / User)
- Location: `pages/admin/`, `components/admin/`

### 🔔 **System Features** (80%)
- ✅ Realtime System (Messages, Typing Indicators, Online Status, Sync Playback)
- ✅ Theme System (Dark/Light Mode Toggle, localStorage Persistence)
- ✅ Toast Notifications (Success, Error, Info, Warning)
- ✅ Error Handling (Error Boundary, 404 Page, Loading States)
- ✅ Security (RLS auf allen Tabellen, Signed URLs, RBAC)
- Location: `hooks/`, `lib/services/`, `components/ui/`

---

## 📋 **Was können die Features? (Details)**

### 🎯 **Issues Tracking System**

**Was ist das?**
Ein vollständiges Issue-Tracking System (wie GitHub Issues/Jira) für Bug-Reports, Feature-Requests und Task-Management.

**Hauptfunktionen:**
- ✅ **CRUD Operations**: Create, Edit, Delete Issues
- ✅ **Status Management**: Open → In Progress → Done → Closed
- ✅ **Priority System**: Low, Medium, High, Critical (mit Smart-Sorting)
- ✅ **Categories**: Feature, Bug, Refactoring, Docs, Testing, Enhancement
- ✅ **Labels System**: Multi-Select Tags (bug, urgent, enhancement, etc.)
- ✅ **Assignment**: Issues zu Usern zuweisen (mit Lock-Protection gegen Race Conditions)
- ✅ **Comments**: Kommentare mit Action-Log (status_change, assignment, label_change)
- ✅ **PR Integration**: Pull Request URLs für "done" Issues
- ✅ **Filtering**: Status, Priority, Category, Labels, Author, Assignee
- ✅ **Search**: Title + Description Full-Text Search
- ✅ **Stats Cards**: Total, Open, In Progress, Done, Urgent Count
- ✅ **Bulk Actions**: Bulk Status/Priority Update, Bulk Delete
- ✅ **CLI Scripts**: Claude kann Issues via Node.js Script erstellen!

**CLI Usage (für Claude):**
```bash
cd web/frontend
# Single Issue
node scripts/claude-create-issue.js "Title" "Description" [category] [priority] [labels] [status]

# Batch Issues
node scripts/claude-create-issue-batch.js  # Editiere Script für mehrere Issues
```

**Location:**
- Page: `pages/admin/AdminIssues.tsx`
- Hook: `hooks/useIssues.ts`
- Service: `lib/services/issues/issuesService.ts`
- Components: `components/admin/IssueCard.tsx`, `IssueModalEnhanced.tsx`, `IssueCommentPanel.tsx`

**Wichtige Hinweise:**
- ⚠️ **Realtime nicht zuverlässig**: UI nutzt manuelle Refreshs nach CRUD
- 📝 **Status Format**: `in_progress` (underscore, NICHT hyphen!)
- 🔐 **RLS Policy**: Nur Admins/Moderators können Issues sehen/editieren

---

### 🎵 **Sync Playback (Listening Sessions)**

**Was ist das?**
Multi-User synchronized audio playback - User können gemeinsam Tracks anhören in Echtzeit!

**Wie funktioniert's?**
- **Host Mode**: User startet Sync → wird Host → steuert Playback
- **Listener Mode**: Andere User sehen "Join" Button → klicken → hören synchron mit
- **Broadcast**: Play/Pause/Seek Events über Supabase Realtime
- **UI**: Sync Button (🔗/🎛️/👂) in AudioPlayer Transport Controls

**Features:**
- ✅ Host/Listener Roles (automatisch)
- ✅ Realtime Play/Pause/Seek Sync
- ✅ Sync State Indicator ("Hosting" / "Listening to @username")
- ✅ Listener Count anzeigen
- ✅ Join Button wenn anderer Host aktiv
- ✅ Auto-Cleanup bei Host Leave

**Location:**
- Hook: `hooks/useSyncPlayback.ts` (komplett implementiert!)
- Component: `components/audio/AudioPlayer.tsx`
- Styles: `styles/components/audio/_audio-player-sync.scss`

**Use Case:**
Producer teilt Track Preview mit Band → alle hören gleichzeitig → geben Feedback in Echtzeit!

---

### 📁 **Floating File Browser**

**Was ist das?**
Ein schwebendes, draggable File Browser Fenster das über allen Routes persistiert!

**Features:**
- ✅ Pop-out Window (React Portal)
- ✅ Draggable (Move via Title Bar)
- ✅ Resizable (Ecken/Kanten)
- ✅ Pin/Unpin (bleibt offen beim Route-Wechsel)
- ✅ Minimize/Restore
- ✅ localStorage Persistence (Position, Size, State)
- ✅ Route-Persistence (bleibt beim Navigation offen!)
- ✅ Placeholder wenn floating (zeigt Info Card in original location)

**Location:**
- Component: `components/files/FloatingFileBrowserContainer.tsx`
- Context: `contexts/FloatingFileBrowserContext.tsx`
- Hook: `hooks/useFloatingFileBrowser.ts`
- Styles: `styles/components/files/_file-browser-floating.scss`

**Use Case:**
User arbeitet in Projects → öffnet File Browser floating → navigiert zwischen Routes → Browser bleibt offen!

---

### 🎨 **Custom Image Cropper (Avatar)**

**Was ist das?**
Ein **komplett selbst gebauter** Canvas-basierter Image Cropper - KEINE externe Library!

**Features:**
- ✅ Circular Crop Preview
- ✅ Drag & Drop Image Positioning
- ✅ Zoom Slider (1x-3x)
- ✅ Size Slider (100px-400px Output)
- ✅ 512x512 JPEG Output (85% Quality)
- ✅ White Background Fill (keine schwarzen Ränder)
- ✅ Dark Mode Support
- ✅ Live Preview während Crop

**Location:**
- Component: `components/settings/ImageCropperModal.tsx`
- Service: `lib/services/avatarService.ts`
- Usage: `components/settings/ProfileSettingsSection.tsx`

**Tech:**
- Canvas API für Crop
- FileReader API für Upload
- Blob Output für Server Upload

---

### 📊 **Analytics System (Dual-Source)**

**Was ist das?**
Zwei verschiedene LOC-Quellen für unterschiedliche Zwecke!

**1. LIVE LOC (StatsGrid Kachel):**
- Backend API (`localhost:3001/api/analytics/code-metrics`)
- Git Commands (git ls-files, git rev-list)
- **Problem**: Nur lokal, in Production = Fallback (46.721)
- **Lösung**: Backend auf Render.com deployen!

**2. CHART LOC (Historical Snapshots):**
- GitHub Actions (täglich 00:00 UTC)
- Script: `scripts/analytics/create-snapshot-github-actions.js`
- Speichert in Supabase: `project_snapshots` Table
- **Zählt**: Komplettes Repo (mehr als lokales Backend)

**Location:**
- Frontend: `pages/admin/AdminAnalytics.tsx`
- Backend: `web/backend/src/index.ts` (Analytics Endpoint)
- Service: `lib/services/analytics/codeMetricsService.browser.ts`
- GitHub Actions: `.github/workflows/daily-snapshot.yml`

---

### 🎛️ **Peak Meters (Professional Audio)**

**Was ist das?**
Professionelle Audio-Level-Metering wie in DAWs (Cubase, Ableton)!

**Features:**
- ✅ Stereo L/R Channels (separate Meters)
- ✅ Gradient Bars (Green → Yellow → Orange → Red)
- ✅ Clipping Detection (blinkt bei >0dB)
- ✅ Peak Hold Indicators (zeigt höchsten Peak)
- ✅ dBFS Numeric Display (-∞ bis 0 dB)
- ✅ Master Peak Meter (für komplettes Project)
- ✅ Real-time via Web Audio API

**Location:**
- Component: `components/audio/PeakMeter.tsx`, `MasterPeakMeter.tsx`
- Hook: `hooks/usePeakMeter.ts`
- Styles: `styles/components/audio/_peak-meter.scss`

**Tech:**
- Web Audio API (AnalyserNode)
- getByteTimeDomainData() für Peak-Detection
- requestAnimationFrame für Smooth Animation

---

## 🚧 **Teilweise Implementiert** (Baustellen!)

- 🔨 **Track Versioning** (40%): DB Schema exists, Git-Style History UI fehlt
- 🔨 **MIDI Support** (30%): DB Schema + Basic Events, Editor fehlt komplett
- 🔨 **Multi-Track Mixing** (50%): Einzelne Tracks OK, Timeline-View fehlt
- 🔨 **Search System** (50%): User Search OK, Global Search fehlt
- 🔨 **Mobile Responsiveness** (60%): Header/Chat/Files OK, Admin/Projects braucht Optimierung
- 🔨 **Speech-to-Text** (60%): Funktioniert, Genauigkeit Browser-abhängig
- 🔨 **Email Invitations** (90%): Edge Function hat trailing spaces Bug

---

## ❌ **Nicht Implementiert** (Geplant)

- ❌ **VST Plugin** (5%): Nur JUCE "Hello World", keine OAuth/Cloud Integration
- ❌ **Desktop App** (3%): Basic C++ Structure, keine Supabase Integration
- ❌ **Audio Enhancement** (0%): Keine Dolby.io API, kein Self-Hosted Processing
- ❌ **MIDI Editor** (0%): Piano Roll UI fehlt komplett
- ❌ **Voice Messages** (0%): Record Audio in Chat
- ❌ **Video Calls** (0%): WebRTC Integration
- ❌ **Kanban Board** (0%): Issue Tracking Visualization
- ❌ **Project Export** (0%): Backup/Restore
- ❌ **Offline Mode** (0%): Service Worker + IndexedDB

---

## 🐛 **Bekannte Bugs & Issues**

**Critical:**
1. **Analytics Backend offline**: Live LOC nur auf `localhost:3001`, Production zeigt Fallback (46.721)
2. **Realtime nicht zuverlässig**: Manuelle Refreshs nötig nach CRUD (Issues, Users, Projects)
3. **Console.logs**: 303 Vorkommen in 74 Files (Cleanup für Production nötig)

**Medium:**
4. **Code TODOs**: 24 TODOs nicht in Issues-System getrackt
5. **Windows Bug**: `nul` File im Root (löschen + `.gitignore`)
6. **Email Invitations**: Trailing spaces Bug in Edge Function redirect

**Low:**
7. **File Search**: Nur Basic Implementation, Advanced Filters fehlen
8. **Mobile UX**: Admin Panel & Projects brauchen Responsive Optimization

---

## 📊 **Code-Statistiken**

- **Codebase**: ~94.000 LOC (nach Refactoring: -78k LOC entfernt!)
- **TypeScript Files**: 327
- **React Components**: 80+
- **Custom Hooks**: 60+
- **Service Modules**: 15+
- **Pages/Routes**: 20+
- **Database Tables**: 19 (3 Migrations komplett)
- **Indexes**: 23 Performance-Indexes
- **Triggers**: 6 Auto-Update Triggers

---

## 📂 **Code-Struktur** (Wo finde ich was?)

```
web/frontend/src/
├── pages/                    # 20+ Seiten
│   ├── auth/                # Login, Register, Recovery
│   ├── admin/               # Admin Panel (Dashboard, Users, Issues, Analytics)
│   ├── projects/            # Project List, Project Detail
│   ├── files/               # File Browser
│   ├── dashboard/           # Dashboard, Social
│   ├── settings/            # User Settings
│   └── profile/             # User Profile
├── components/              # 80+ Components
│   ├── admin/               # Admin Components (Tables, Modals, Stats)
│   ├── audio/               # AudioPlayer, Waveform, PeakMeter, Sync Playback
│   ├── auth/                # Login/Register Forms, OAuth
│   ├── chat/                # Chat Window, Messages, Sidebar
│   ├── files/               # File Browser, Floating Window
│   ├── projects/            # Project CRUD, Collaborators, Invites
│   ├── tracks/              # Track Upload, Settings, Comments
│   ├── social/              # Friends, Followers, User Search
│   ├── settings/            # Settings Sections, Profile Editor
│   └── ui/                  # Button, Input, Loading, Avatar, Toast
├── hooks/                   # 60+ Custom Hooks
│   ├── useAuth.ts           # Auth State
│   ├── useAdmin.ts          # Admin State
│   ├── useProjects.ts       # Project Management
│   ├── useTracks.ts         # Track Management
│   ├── useSyncPlayback.ts   # Synchronized Playback (Host/Listener)
│   ├── usePeakMeter.ts      # Audio Level Metering
│   ├── useConversations.ts  # Chat Conversations
│   ├── useMessages.ts       # Chat Messages
│   ├── useFeatureFlags.ts   # Feature Flags
│   └── useAnalytics.ts      # Analytics Data
├── lib/
│   ├── services/            # 15+ Service Modules
│   │   ├── projects/        # projectsService, collaboratorsService
│   │   ├── tracks/          # tracksService, commentsService
│   │   ├── files/           # userFilesService
│   │   ├── analytics/       # metricsService, snapshotsService, codeMetricsService
│   │   ├── issues/          # issuesService, commentsService
│   │   ├── featureFlags/    # featureFlagsService
│   │   └── storage/         # trackStorage, avatarService
│   ├── validation/          # Zod Schemas
│   └── supabase.ts          # Supabase Client
├── styles/                  # SCSS (Modulare Struktur!)
│   ├── components/          # Component-spezifische Styles
│   ├── pages/               # Page-spezifische Styles
│   └── utilities/           # Variables, Mixins, Base
└── contexts/                # React Contexts
    └── FloatingFileBrowserContext.tsx
```

---

## 🎯 **Roadmap** (Updated 2025-10-28)

**Nächste Schritte (Realistische Prioritäten):**

**Phase 1: Bug Fixing & Polish** (Jetzt!)
1. Backend auf Render.com deployen (Analytics Fix)
2. Console.logs Cleanup (303 Vorkommen)
3. TODOs in Issues-System tracken (24 TODOs)
4. Realtime Reliability verbessern
5. Mobile Responsiveness (Admin/Projects)

**Phase 2: Core Features Complete** (2-4 Wochen)
6. Track Versioning UI (Git-Style Commits)
7. Multi-Track Timeline View
8. MIDI Editor (Piano Roll Basics)
9. Global Search System
10. Kanban Board (Issues Visualization)

**Phase 3: VST Integration** (4-8 Wochen)
11. VST Plugin Development (JUCE + OAuth2)
12. Desktop App (C++ + Supabase)
13. Cloud ↔ DAW Bridge
14. Audio Enhancement (Dolby.io API oder Self-Hosted)

**Phase 4: Pro Features** (8+ Wochen)
15. Voice Messages + Video Calls
16. Mobile App (React Native)
17. Project Export/Backup
18. Offline Mode
19. Notification Panel

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
