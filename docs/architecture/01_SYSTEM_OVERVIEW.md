# System Overview - DegixDAW Architecture

**Erstellt:** 2025-10-17
**Version:** 1.0

---

## 📐 Komponenten-Übersicht

### Die 3 Hauptkomponenten

```
┌─────────────────────────────────────────────────────────────────────┐
│                          DegixDAW ECOSYSTEM                          │
└─────────────────────────────────────────────────────────────────────┘

1. WEB BROWSER (Frontend)
   ├─ Framework: React 19 + TypeScript
   ├─ Build: Vite
   ├─ Styling: SCSS
   └─ Deployment: Netlify

2. SUPABASE (Backend)
   ├─ Database: PostgreSQL
   ├─ Storage: S3-compatible
   ├─ Auth: Email/OAuth
   ├─ Realtime: WebSocket
   └─ Edge Functions: Serverless

3. VST PLUGIN (DAW Integration)
   ├─ Framework: JUCE (C++)
   ├─ Format: VST3
   ├─ Compiler: MSVC 2022
   └─ Target: Cubase, Ableton, Logic, FL Studio
```

---

## 🌐 Web Frontend (Port 5173)

### Tech Stack

```
React 19 + TypeScript + Vite
├─ Supabase JS Client
├─ Tone.js (MIDI/Audio)
├─ WaveSurfer.js (Waveform)
├─ React Router (Navigation)
├─ Zod (Validation)
└─ React Hot Toast (Notifications)
```

### Hauptfeatures

#### 1. MIDI Editor (NEU - 0%)
```typescript
// Komponenten:
├─ PianoRoll.tsx          // Grid-based Note Editor
├─ DrumSequencer.tsx      // Step Sequencer
├─ MIDIPlayback.tsx       // Tone.js Integration
├─ MIDIExport.tsx         // .mid File Export
└─ MIDIProjectList.tsx    // Saved Projects
```

#### 2. Audio Timeline (NEU - 0%)
```typescript
// Komponenten:
├─ AudioTimeline.tsx      // Multi-Track Layout
├─ WaveformDisplay.tsx    // WaveSurfer.js
├─ AudioUpload.tsx        // Drag & Drop
├─ PlaybackControls.tsx   // Play/Pause/Stop
└─ TrackMixer.tsx         // Volume/Pan
```

#### 3. Projekt-Management (20%)
```typescript
// Komponenten:
├─ ProjectList.tsx        // User Projects
├─ ProjectEditor.tsx      // Metadata (BPM, Key, etc.)
├─ ProjectSharing.tsx     // Collaborator Management
└─ ProjectVersions.tsx    // Version Control
```

#### 4. Chat & Social (60% FERTIG)
```typescript
// Bereits implementiert:
├─ ChatSidebar.tsx        ✅
├─ MessageList.tsx        ✅
├─ FileAttachments.tsx    ✅
├─ FriendList.tsx         ✅
└─ SocialDashboard.tsx    🟡 (40%)
```

#### 5. Admin Panel (80% FERTIG)
```typescript
// Bereits implementiert:
├─ UserManagement.tsx     ✅
├─ IssueTracking.tsx      ✅
├─ FeatureFlags.tsx       ✅
├─ Analytics.tsx          ✅
└─ Settings.tsx           ✅
```

---

## 🗄️ Backend (Supabase)

### PostgreSQL Database

```
Haupttabellen:
├─ projects              // Musik-Projekte
├─ tracks                // Audio/MIDI Tracks
├─ midi_events           // Detaillierte MIDI Daten
├─ mixdowns              // Rendered Versions
├─ presets               // FX/Instrument Presets
├─ project_collaborators // Sharing & Permissions
├─ track_comments        // Collaboration Comments
└─ project_versions      // Version Control

Existing Tables (Chat/Social):
├─ profiles              ✅
├─ conversations         ✅
├─ messages              ✅
├─ friendships           ✅
└─ issues                ✅
```

Siehe: [02_DATABASE_SCHEMA.md](02_DATABASE_SCHEMA.md)

### Storage Buckets

```
chat-attachments/        (EXISTING)
└─ Chat files

music-projects/          (NEW)
├─ midi/
├─ audio/
├─ mixdowns/
└─ presets/

project-thumbnails/      (NEW)
└─ Cover Art

user-samples/            (FUTURE)
└─ Sample Library
```

Siehe: [04_STORAGE_STRATEGY.md](04_STORAGE_STRATEGY.md)

### Authentication

```
Supported Methods:
├─ Email/Password         ✅
├─ Google OAuth           ✅
├─ Discord OAuth          ✅
└─ Magic Link            🟡 (optional)

Role System:
├─ User                   (Standard)
├─ Beta-User              (Early Access)
├─ Moderator              (Community Management)
├─ Admin                  (Full Access)
└─ Super-Admin            (Immutable, defined by ENV)
```

### Realtime

```
Subscriptions:
├─ New Messages          ✅
├─ Friend Requests       ✅
├─ Project Updates       🔴 (TODO)
├─ Mixdown Notifications 🔴 (TODO)
└─ Collaborator Changes  🔴 (TODO)
```

---

## 🔌 VST Plugin (JUCE C++)

### Plugin Architecture

```cpp
DegixDAWPlugin
├─ AudioProcessor        // VST3 Interface
├─ PluginEditor          // UI Component
├─ SupabaseClient        // HTTP Client
├─ AuthManager           // OAuth2 Flow
├─ ProjectManager        // Project CRUD
└─ FileDownloader        // MIDI/Audio Download
```

### Komponenten

#### 1. Audio Processing (Passthrough)
```cpp
void processBlock(AudioBuffer<float>& buffer, MidiBuffer& midi)
{
    // Plugin ist kein Audio-Effekt, nur File-Manager
    // Audio wird nicht verändert
}
```

#### 2. UI Components
```cpp
LoginButton              // OAuth Login
ProjectListBox           // List of User Projects
LoadToDAWButton          // Download & Import
UploadMixdownButton      // Upload rendered Audio
PresetBrowser            // Browse & Download Presets
StatusBar                // Connection Status
```

#### 3. Network Client
```cpp
class SupabaseClient {
    Result login(email, password) → JWT token
    Result fetchProjects(token) → JSON array
    Result downloadFile(token, path) → File
    Result uploadFile(token, path, File) → Success
    String getSignedUrl(token, bucket, path) → URL
}
```

Siehe: [05_VST_PLUGIN.md](05_VST_PLUGIN.md)

---

## 📱 Desktop App (C++ Win32)

### Status: Optional / Low Priority

```
Current State: 3%
├─ File Browser          🟡
├─ Supabase Auth         🟡
└─ Image Preview         🟡

Future Goals:
├─ Standalone DAW Editor
├─ Offline Sync
└─ File Management

Decision: Fokus auf VST Plugin, Desktop App später!
```

---

## 🔄 Interaktionen zwischen Komponenten

### Browser ↔ Supabase

```
Authentication:
Browser → Supabase Auth → JWT Token → Browser

CRUD Operations:
Browser → Supabase PostgREST API → Database

File Upload:
Browser → Supabase Storage API → S3

Real-time:
Browser ← Supabase Realtime WebSocket ← Database Triggers
```

### VST Plugin ↔ Supabase

```
Authentication:
VST → Open Browser → OAuth Flow → Callback URL → VST gets Token

Fetch Projects:
VST → HTTPS GET /rest/v1/projects → JSON Response

Download Files:
VST → HTTPS POST /storage/signed-url → Get URL
VST → HTTPS GET signed-url → Download File

Upload Mixdown:
VST → HTTPS POST /storage/upload → Upload File
VST → HTTPS POST /rest/v1/mixdowns → Create DB Entry
```

Siehe: [03_DATA_FLOW.md](03_DATA_FLOW.md)

### Browser ↔ VST (Indirect)

```
Browser: User erstellt Projekt
   ↓
Supabase: Projekt gespeichert
   ↓
VST Plugin: Lädt Projekt-Liste neu
   ↓
DAW: User importiert Tracks
   ↓
DAW: User rendert Mixdown
   ↓
VST Plugin: Uploaded Mixdown
   ↓
Supabase: Notification an Producer
   ↓
Browser: Producer sieht Notification
```

---

## 🛠️ Development Environment

### Web Frontend

```bash
# Development
cd web/frontend
npm run dev              # Vite Dev Server (Port 5173)

# Build
npm run build            # Production Build
npm run preview          # Preview Build

# Testing
npm test                 # Jest + React Testing Library
npm run lint             # ESLint
```

### Backend

```bash
# Local Supabase (Optional)
npx supabase start       # Docker Containers

# Migrations
npx supabase db push     # Push SQL to cloud
npx supabase db pull     # Pull schema from cloud

# Edge Functions
npx supabase functions serve  # Local development
npx supabase functions deploy # Deploy to production
```

### VST Plugin

```bash
# Windows (MSVC)
cd vst-plugin
cmake -B build -G "Visual Studio 17 2022"
cmake --build build --config Release

# Output:
# build/DegixDAW_artefacts/Release/VST3/DegixDAW.vst3

# Install to DAW:
# Copy .vst3 to: C:\Program Files\Common Files\VST3\
```

### Desktop App

```bash
# Windows
cd desktop
compile.bat              # F5 auf Tastatur-Makro

# Output:
# desktop/build/DegixDAW.exe
```

---

## 📊 Dependencies

### Frontend (package.json)

```json
{
  "dependencies": {
    "react": "^19.0.0",
    "@supabase/supabase-js": "^2.x",
    "tone": "^15.x",           // NEW: MIDI/Audio
    "wavesurfer.js": "^7.x",   // NEW: Waveform
    "react-router-dom": "^6.x",
    "zod": "^3.x"
  }
}
```

### VST Plugin (CMakeLists.txt)

```cmake
# JUCE Framework
add_subdirectory(JUCE)

# cURL for HTTP requests
find_package(CURL REQUIRED)

# JSON parsing
add_subdirectory(nlohmann_json)

target_link_libraries(DegixDAW
    juce::juce_audio_processors
    juce::juce_audio_utils
    CURL::libcurl
    nlohmann_json::nlohmann_json
)
```

---

## 🚀 Deployment

### Production URLs

```
Frontend:  https://app.degixdaw.com  (Netlify)
Backend:   https://degixdaw.supabase.co
VST:       GitHub Releases
Desktop:   GitHub Releases
```

### CI/CD

```
Frontend:
├─ Push to main → Netlify Auto-Deploy
└─ Build: npm run build:frontend

VST Plugin:
├─ GitHub Actions: build-vst.yml
└─ Artifacts: DegixDAW.vst3

Desktop:
├─ GitHub Actions: build-desktop.yml
└─ Artifacts: DegixDAW-Desktop.exe
```

Siehe: [06_DEPLOYMENT.md](06_DEPLOYMENT.md)

---

## 🔐 Security

### Authentication

```
Frontend: Supabase JS Client (Auto-refresh JWT)
VST Plugin: OAuth2 Flow via Browser
Desktop App: Same as VST
```

### Row-Level Security (RLS)

```sql
-- Projects: Only creator + collaborators
CREATE POLICY "users_read_own_projects"
ON projects FOR SELECT TO authenticated
USING (
  creator_id = auth.uid() OR
  id IN (SELECT project_id FROM project_collaborators WHERE user_id = auth.uid())
);

-- Storage: Private files via RLS
CREATE POLICY "collaborators_read_files"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'music-projects' AND
  -- Check if user is collaborator
);
```

### API Keys

```bash
# Environment Variables
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx...  (public, safe for frontend)
SUPABASE_SERVICE_ROLE_KEY=eyJxxx... (private, backend only!)
```

---

## 📈 Monitoring

### Tools

```
Uptime:    UptimeRobot (free tier)
Errors:    Sentry (optional)
Analytics: Supabase built-in
Logs:      Supabase Dashboard
```

### Metrics

```
Frontend:
├─ Page Load Time
├─ API Response Time
├─ Error Rate
└─ User Session Duration

Backend:
├─ Database Queries/sec
├─ Storage Bandwidth
├─ Auth Requests/sec
└─ Realtime Connections

VST Plugin:
├─ Download Success Rate
├─ Upload Success Rate
└─ Auth Token Refresh Rate
```

---

## 🎯 Next Steps

1. **Implement Database Schema** → [02_DATABASE_SCHEMA.md](02_DATABASE_SCHEMA.md)
2. **Setup Storage Buckets** → [04_STORAGE_STRATEGY.md](04_STORAGE_STRATEGY.md)
3. **Build MIDI Editor v1** → Start with Tone.js
4. **Build VST Plugin v1** → JUCE Setup + Supabase Client

---

**See also:**
- [00_BIG_PICTURE.md](00_BIG_PICTURE.md) - Gesamtübersicht
- [03_DATA_FLOW.md](03_DATA_FLOW.md) - User Journeys
- [05_VST_PLUGIN.md](05_VST_PLUGIN.md) - JUCE Details
