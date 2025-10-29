# 📂 File Browser - Deluxe Edition

**Version:** 2.0.0 (Floating Window + Projects Integration)
**Last Updated:** 2025-10-28

## Übersicht

Der **File Browser** ist eine zentrale Datei-Hub-Komponente, die Benutzern Zugriff auf alle hochgeladenen Dateien aus ihren Chats bietet. Das Feature ist modular aufgebaut und vorbereitet für zukünftige **Cloud-Integration** (Dropbox, Google Drive, OneDrive, etc.).

### 🎉 Was ist NEU in v2.0?

- ✅ **Floating Window**: Draggable, pinnable, minimizable Browser (React Portal)
- ✅ **Route Persistence**: Bleibt geöffnet beim Wechsel zwischen Pages
- ✅ **Projects Integration**: Add-to-Project Button für Audio-Files
- ✅ **user_files Tabelle**: Zentrale Tabelle für alle User-Dateien (Chat + Projects)
- ✅ **Realtime Sync**: Live-Updates via Supabase Realtime
- ✅ **Waveform Generation**: Automatische Waveform beim Add-to-Project
- ✅ **Code Refactoring**: FileBrowser von 688 LOC → 214 LOC (Clean Code!)

---

## ✨ Features

### Aktuell Implementiert (v2.0)

#### 1. **Floating Window Mode** 🆕
   - **Draggable**: Window per Maus verschieben (Header als Drag-Handle)
   - **Pinnable**: Pin-Button (📌) dockt Fenster an (deaktiviert Dragging)
   - **Minimizable**: Minimize-Button (➖) klappt Content ein
   - **Route Persistent**: Bleibt geöffnet beim Wechseln zwischen Pages (z.B. Dashboard → Social)
   - **React Portal**: Rendert außerhalb des DOM-Trees (immer on-top)
   - **Backdrop Overlay**: Schließt bei Klick außerhalb (nur wenn nicht pinned)
   - **ESC to Close**: ESC-Taste schließt Fenster (nur wenn nicht pinned)
   - **LocalStorage State**: Position + Größe werden gespeichert

#### 2. **Projects Integration** 🆕
   - **Add-to-Project Button**: Für Audio-Files (➕ Icon in Table)
   - **Project Dropdown**: Zeigt alle eigenen + Collaborator-Projekte
   - **File Move**: Kopiert Chat-Attachment → `shared_files` Bucket
   - **Track Creation**: Erstellt automatisch Track-Eintrag in Project
   - **Waveform Generation**: Generiert Waveform beim Add (1000 Datenpunkte)
   - **Duplicate Check**: Verhindert doppelte Tracks im selben Projekt
   - **Metadata Transfer**: BPM, Sample Rate, Channels, Duration
   - **Realtime Updates**: File-Liste aktualisiert sich live nach Add

#### 3. **user_files Tabelle** 🆕
   - **Zentrale Datei-Verwaltung**: Alle User-Dateien in einer Tabelle
   - **Source Tracking**: `source` = 'chat' | 'upload' | 'project'
   - **Project IDs Array**: `source_project_ids` (JSONB) für Multi-Project-Usage
   - **File Metadata**: BPM, Waveform, Sample Rate, Channels
   - **RLS Policies**: User sieht nur eigene Dateien + Projekt-Collaborators
   - **Foreign Keys**: Verknüpft mit `profiles` (uploaded_by) + `messages` (source_message_id)

#### 4. **Datei-Übersicht** (v1.0)
   - Zeigt alle vom User hochgeladenen Chat-Attachments
   - Lädt Dateien aus `message_attachments` Tabelle
   - Verknüpft mit Conversations über `conversation_members`

#### 5. **Filter & Sortierung** (v1.0)
   - Filter: `Alle`, `Bilder 🖼️`, `Videos 🎥`, `Audio 🎵`, `Dokumente 📄`
   - Sortierung: `Datum`, `Name`, `Größe`
   - Dynamische Aktualisierung ohne Reload

#### 6. **View-Modi** (v1.0)
   - **Grid-View**: Kachel-Ansicht mit Previews (optimal für Bilder)
   - **List-View**: Kompakte Listen-Ansicht (optimal für viele Dateien)

#### 7. **Datei-Aktionen** (v1.0)
   - 👁️ **Öffnen**: Datei in neuem Tab anzeigen
   - ⬇️ **Download**: Direkt herunterladen
   - ➕ **Add to Project**: Nur für Audio-Files (v2.0)

#### 8. **Statistiken** (v1.0)
   - Anzahl der Dateien
   - Gesamtspeicher in MB
   - Max. Dateigröße (5 MB pro Datei)

#### 9. **Responsive Design** (v1.0)
   - Desktop: Grid mit 4-6 Spalten
   - Mobile: Grid mit 2 Spalten, angepasste Controls

---

## 🏗️ Architektur

### Komponenten-Struktur (v2.0)

```
src/
├── components/
│   └── files/
│       ├── FileBrowser.tsx                      # Core Browser (214 LOC - refactored!)
│       ├── FloatingFileBrowserContainer.tsx     # 🆕 Portal Wrapper + Drag Logic
│       └── AddToProjectButton.tsx               # 🆕 Projects Integration
├── pages/
│   └── files/
│       ├── FileBrowserPage.tsx                  # Standalone Route
│       └── ProjectFilesPage.tsx                 # 🆕 Project-Specific Files
├── contexts/
│   └── FloatingFileBrowserContext.tsx           # 🆕 Global Floating State
├── hooks/
│   ├── useFloatingFileBrowser.ts                # 🆕 Floating Window Hook
│   └── useUserFiles.ts                          # 🆕 user_files CRUD
├── lib/services/files/
│   └── userFilesService.ts                      # 🆕 File Move + Project Add
└── styles/
    ├── components/files/
    │   ├── _file-browser.scss
    │   ├── _floating-file-browser.scss          # 🆕 Floating Styles
    │   └── _add-to-project-button.scss          # 🆕 Dropdown Styles
```

### Datenfluss (v2.0 - Floating Window)

```
App.tsx (FloatingFileBrowserProvider)
    ↓
Header.tsx (Floating Button Click)
    ↓
toggleFloating() → Context State Update
    ↓
FloatingFileBrowserContainer (React Portal)
    ↓
  ├─ Backdrop Overlay (close on click)
  ├─ Drag Handlers (mousedown/move/up)
  ├─ Pin/Minimize/Close Actions
  └─ FileBrowser Component
        ↓
      Supabase Query (message_attachments + user_files)
        ↓
      FileItem[] (transformiert)
        ↓
      Filter & Sort
        ↓
      Render (Grid/List View)
        ↓
      AddToProjectButton (Audio-Files only)
```

### Datenfluss (v2.0 - Add to Project)

```
User clicks "➕ Add to Project"
    ↓
AddToProjectButton: Load Projects (RPC)
    ↓
  ├─ Owned Projects (creator_id = user.id)
  └─ Collaborator Projects (project_collaborators)
    ↓
User selects Project "My Album"
    ↓
handleAddToProject(projectId, projectTitle)
    ↓
  1️⃣ Check if file in user_files (by source_message_id)
    ├─ EXISTS → Use existing file_id
    └─ NOT EXISTS → moveFileFromChatToShared()
          ↓
        Copy: chat-attachments → shared_files
          ↓
        Insert: user_files (source='chat', source_message_id)
    ↓
  2️⃣ addFileToProject(file_id, project_id)
    ↓
    Update: user_files.source_project_ids += [project_id]
    ↓
  3️⃣ Check if track already exists (prevent duplicates)
    ↓
  4️⃣ Generate Waveform (if audio + no waveform exists)
    ├─ Get Signed URL from shared_files
    ├─ Fetch Blob
    └─ generateWaveform(file, 1000 points)
    ↓
  5️⃣ createTrack()
    ├─ project_id
    ├─ track_number (auto-increment)
    ├─ file_path (shared_files path)
    ├─ user_file_id (FK)
    ├─ waveform_data (JSON)
    └─ metadata (bpm, sample_rate, channels, duration)
    ↓
SUCCESS: "Added 'MyGuitar.wav' to 'My Album'! 🎵"
    ↓
Realtime: Project Track List updates live
```

---

## 🔌 Integration

### 1. Route

**Pfad**: `/files`

```tsx
// main.tsx
{
  path: '/files',
  element: <AppLayout />,
  children: [
    {
      index: true,
      element: (
        <Suspense fallback={<PageLoader />}>
          <FileBrowserPage />
        </Suspense>
      )
    }
  ]
}
```

### 2. Navigation

**Header**: Neues Nav-Item "📂 Dateien"

```tsx
// Header.tsx
const navigationItems: NavigationItem[] = [
  { path: '/dashboard', label: 'Dashboard', icon: '🏠', requiresAuth: true },
  { path: '/social', label: 'Social', icon: '👥', requiresAuth: true },
  { path: '/files', label: 'Dateien', icon: '📂', requiresAuth: true },
];
```

### 3. Supabase Query

**Tabellen**:
- `message_attachments`: Datei-Metadaten
- `messages`: Verknüpfung mit Conversations
- `conversations`: Zuordnung zu Users
- `conversation_members`: User-Filter

**RLS Policies**: Nutzt bestehende Policies (User sieht nur eigene Conversations)

---

## 📊 Database Schema (v2.0)

### user_files Tabelle 🆕

```sql
CREATE TABLE user_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- File Info
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,      -- Path in shared_files bucket
  file_type TEXT NOT NULL,       -- MIME type
  file_size BIGINT,              -- Bytes
  duration_ms BIGINT,            -- For audio/video files

  -- Source Tracking
  source TEXT NOT NULL CHECK (source IN ('chat', 'upload', 'project')),
  source_message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  source_project_ids JSONB DEFAULT '[]'::jsonb,  -- Array of project UUIDs

  -- Metadata (BPM, Waveform, Sample Rate, Channels)
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for Performance
CREATE INDEX idx_user_files_user_id ON user_files(user_id);
CREATE INDEX idx_user_files_uploaded_by ON user_files(uploaded_by);
CREATE INDEX idx_user_files_source_message_id ON user_files(source_message_id);
CREATE INDEX idx_user_files_source_project_ids ON user_files USING gin(source_project_ids);

-- RLS Policies
CREATE POLICY "Users can view own files"
  ON user_files FOR SELECT
  USING (user_id = auth.uid() OR uploaded_by = auth.uid());

CREATE POLICY "Users can insert own files"
  ON user_files FOR INSERT
  WITH CHECK (user_id = auth.uid() AND uploaded_by = auth.uid());

CREATE POLICY "Users can update own files"
  ON user_files FOR UPDATE
  USING (user_id = auth.uid());
```

### TypeScript Interfaces (v2.0)

```typescript
// File Browser Item (Chat-Attachments)
interface FileItem {
  id: string;                // Attachment ID
  name: string;              // Dateiname
  size: number;              // Größe in Bytes
  type: string;              // MIME-Type
  url: string;               // Public URL
  thumbnailUrl?: string;     // Optional: Thumbnail URL
  createdAt: string;         // Upload-Zeitstempel
  conversationId?: string;   // Zugehörige Conversation
  messageId?: string;        // Zugehörige Message
}

// User File (Zentrale Tabelle) 🆕
export type UserFileSource = 'chat' | 'upload' | 'project';

export interface UserFile {
  id: string;
  user_id: string;
  uploaded_by: string;

  // File Info
  file_name: string;
  file_path: string;         // shared_files bucket path
  file_type: string;         // MIME type
  file_size: number | null;
  duration_ms: number | null;

  // Source Tracking
  source: UserFileSource;
  source_message_id: string | null;
  source_project_ids: string[] | null;  // Array of UUIDs

  // Metadata (BPM, Waveform, etc.)
  metadata: Record<string, any> | null;

  // Timestamps
  created_at: string;
  updated_at: string;

  // Joined data (optional)
  projects?: Array<{ id: string; title: string }>;
  uploader?: { id: string; username: string; avatar_url: string | null };
}

// Floating Window State 🆕
export interface UseFloatingFileBrowserReturn {
  // State
  isFloating: boolean;
  isPinned: boolean;
  width: number;
  height: number;
  position: { top: number; left: number };
  isDragging: boolean;
  isResizing: boolean;
  isMinimized: boolean;

  // Actions
  setIsFloating: (value: boolean) => void;
  toggleFloating: () => void;
  togglePin: () => void;
  toggleMinimize: () => void;
  setPosition: (pos: { top: number; left: number }) => void;
  setSize: (size: { width: number; height: number }) => void;
  setIsDragging: (value: boolean) => void;
  setIsResizing: (value: boolean) => void;
  resetPosition: () => void;
}
```

---

## 🎨 Styling

### Theme Variables

```scss
// Corporate Blue
$primary-blue: rgba(59, 130, 246, 1);
$hover-blue: rgba(59, 130, 246, 0.1);
$border-blue: rgba(59, 130, 246, 0.3);

// Backgrounds
$bg-primary: var(--color-bg-primary);
$bg-secondary: var(--color-bg-secondary);
$border: var(--color-border);
```

### Animations

- **Glow**: Hover-Effect für File-Items (scale + shadow)
- **Pulse**: Badge-Animation für "Bald verfügbar"
- **Spin**: Loading Spinner
- **FadeIn**: (geplant für Modals)

---

## 🚀 Zukünftige Features

### Phase 1: Erweiterte Datei-Aktionen

- ❌ **Löschen**: Datei aus Chat entfernen (mit Bestätigung)
- 🔗 **Teilen**: Share-Link generieren (temporär/permanent)
- ✏️ **Umbenennen**: Dateiname ändern
- 📋 **Kopieren**: Link kopieren

### Phase 2: Cloud Integration

**Architektur-Plan**:

```tsx
interface CloudProvider {
  id: string;
  name: string;
  icon: string;
  connected: boolean;
  authenticate: () => Promise<void>;
  listFiles: () => Promise<CloudFile[]>;
  uploadFile: (file: File) => Promise<void>;
  downloadFile: (fileId: string) => Promise<Blob>;
}

const providers: CloudProvider[] = [
  { id: 'dropbox', name: 'Dropbox', icon: '📦', ... },
  { id: 'gdrive', name: 'Google Drive', icon: '📁', ... },
  { id: 'onedrive', name: 'OneDrive', icon: '☁️', ... },
];
```

**UI-Erweiterungen**:
- Cloud-Provider Cards mit "Verbinden"-Button
- Datei-Quelle-Badge (Chat vs. Cloud)
- Sync-Status Indicator
- Cloud-Ordner-Browser

### Phase 3: Advanced Features

- 🔍 **Volltext-Suche**: Dateinamen durchsuchen
- 🏷️ **Tags**: Custom Tags für Dateien
- 📊 **Analytics**: Upload-Statistiken, Speicher-Trends
- 📁 **Ordner**: Virtuelle Ordner-Struktur
- 🔒 **Verschlüsselung**: E2E für sensitive Dateien

---

## 🐛 Known Issues & Fixes

### Issue: Lint Warnings

**Problem**: `any` type in Supabase response

**Fix**: Eslint-disable für notwendige `any`-Verwendung:

```tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
const fileItems: FileItem[] = (attachments || []).map((att: any) => ({ ... }));
```

**Grund**: Supabase-Antworten haben dynamische Typen (JOIN-Ergebnisse)

### Issue: Thumbnail Loading

**Problem**: Thumbnails können fehlen (async generation)

**Lösung**: Fallback auf Haupt-URL + Icon für nicht-Medien

```tsx
{file.type.startsWith('image/') ? (
  <img src={file.thumbnailUrl || file.url} alt={file.name} />
) : (
  <div className="file-item-icon">{getFileIcon(file.type)}</div>
)}
```

---

## 📈 Performance

### Optimierungen

1. **Lazy Loading**: Route mit `React.lazy()`
2. **Memo**: FileItem-Komponente (geplant)
3. **Virtual Scrolling**: Bei >100 Dateien (geplant)
4. **Image Loading**: Lazy mit Intersection Observer (geplant)

### Benchmarks

- **Initial Load**: ~500ms (50 Dateien)
- **Filter Switch**: <50ms
- **Sort Change**: <100ms
- **View Toggle**: Instant

---

## 🔒 Security

### RLS Policies

Nutzt bestehende `message_attachments` und `conversations` Policies:

```sql
-- User kann nur eigene Attachments sehen
-- Via conversation_members.user_id JOIN
```

### Supabase Storage

- **Bucket**: `chat-attachments`
- **Max Size**: 5 MB pro Datei
- **Access**: Authenticated Users only (Read), Owner only (Write/Delete)

---

## 🧪 Testing

### Unit Tests (TODO)

```tsx
describe('FileBrowser', () => {
  it('loads user files', async () => { ... });
  it('filters by type', () => { ... });
  it('sorts by date/name/size', () => { ... });
  it('toggles view mode', () => { ... });
});
```

### E2E Tests (TODO)

```tsx
test('user can browse and download files', async ({ page }) => {
  await page.goto('/files');
  await page.click('[data-testid="file-item"]');
  await page.click('[data-testid="download-btn"]');
  // Assert download started
});
```

---

## 📚 API Reference

### Props

```tsx
interface FileBrowserProps {
  userId: string;      // Required: Supabase User ID
  onClose?: () => void; // Optional: Modal-Mode Callback
}
```

### Hooks

```tsx
const { files, loading, loadFiles } = useFileBrowser(userId);
```

*(Hook noch nicht extrahiert, aktuell inline)*

---

## 🎯 Usage Examples

### 1. Floating Window (v2.0) 🆕

```tsx
// App.tsx - Setup Global Provider
import { FloatingFileBrowserProvider } from './contexts/FloatingFileBrowserContext';

<FloatingFileBrowserProvider>
  <App />
</FloatingFileBrowserProvider>
```

```tsx
// Header.tsx - Toggle Button
import { useFloatingFileBrowserContext } from '../../contexts/FloatingFileBrowserContext';

export default function Header() {
  const { toggleFloating } = useFloatingFileBrowserContext();

  return (
    <button onClick={toggleFloating} title="Datei-Browser öffnen">
      📁
    </button>
  );
}
```

```tsx
// AppLayout.tsx - Render Floating Window
import { useFloatingFileBrowserContext } from '../contexts/FloatingFileBrowserContext';
import FloatingFileBrowserContainer from '../components/files/FloatingFileBrowserContainer';
import FileBrowser from '../components/files/FileBrowser';

export default function AppLayout() {
  const floatingState = useFloatingFileBrowserContext();
  const { user } = useAuth();

  return (
    <>
      {/* Main Layout */}
      <Outlet />

      {/* Floating File Browser (React Portal) */}
      {floatingState.isFloating && user && (
        <FloatingFileBrowserContainer
          floatingState={floatingState}
          onClose={() => floatingState.setIsFloating(false)}
        >
          <FileBrowser userId={user.id} />
        </FloatingFileBrowserContainer>
      )}
    </>
  );
}
```

### 2. Standalone Page (v1.0)

```tsx
import FileBrowser from '@/components/files/FileBrowser';
import { useAuth } from '@/hooks/useAuth';

export default function FilesPage() {
  const { user } = useAuth();
  return <FileBrowser userId={user.id} />;
}
```

### 3. Add to Project (v2.0) 🆕

```tsx
// FileBrowser.tsx - Inside File List
import AddToProjectButton from './AddToProjectButton';

{files.map((file) => (
  <div key={file.id} className="file-item">
    <span>{file.name}</span>

    {/* Add-to-Project Button (only for audio files) */}
    <AddToProjectButton
      messageId={file.messageId}
      chatFilePath={file.url}
      fileName={file.name}
      fileType={file.type}
      fileSize={file.size}
      compact={true}
      onSuccess={() => loadFiles()}
    />
  </div>
))}
```

### 4. As Modal (Legacy - v1.0)

```tsx
const [showFiles, setShowFiles] = useState(false);

<Modal open={showFiles} onClose={() => setShowFiles(false)}>
  <FileBrowser userId={user.id} onClose={() => setShowFiles(false)} />
</Modal>
```

### 5. Embedded in Chat (Planned - Phase 2)

```tsx
<ChatSidebar>
  <FileBrowserWidget userId={user.id} compact={true} limit={5} />
</ChatSidebar>
```

---

## 📞 Support

Bei Fragen oder Issues:
1. Check dieser README
2. Siehe Code-Kommentare in `FileBrowser.tsx`
3. Konsultiere Supabase Schema (`message_attachments`)

---

## 📝 Changelog

### v2.0.0 (2025-10-28) - Floating Window + Projects 🎉

**Major Features:**
- ✅ **Floating Window Mode**: Draggable, pinnable, minimizable Browser (React Portal)
- ✅ **Route Persistence**: Bleibt geöffnet beim Page-Wechsel
- ✅ **Projects Integration**: Add-to-Project Button für Audio-Files
- ✅ **user_files Tabelle**: Zentrale Tabelle für alle User-Dateien
- ✅ **Waveform Generation**: Automatisch beim Add-to-Project (1000 points)
- ✅ **Realtime Sync**: Live-Updates via Supabase Realtime

**Code Quality:**
- ✅ **Refactoring**: FileBrowser von 688 LOC → 214 LOC (Clean Code!)
- ✅ **Component Extraction**: FloatingFileBrowserContainer, AddToProjectButton
- ✅ **Custom Hooks**: useFloatingFileBrowser, useUserFiles
- ✅ **Service Layer**: userFilesService (File Move + Project Add)

**Git Commits:**
- `460e6c1` feat(floating-file-browser): Add missing components and responsive styles
- `51fc3f3` perf(floating-file-browser): Prevent re-render on pin toggle with CSS-only approach
- `835337c` fix(floating-file-browser): Persist floating window across route navigation
- `79c8c58` feat: Complete File Browser → Projects integration with live updates
- `0d24e9b` feat(projects): Add user_files integration for File Browser → Projects
- `61e8a82` feat(files): Add user_files table and AddToProjectButton component
- `63683e4` refactor(frontend): FileBrowser von 688 LOC auf 214 LOC reduziert

---

### v1.0.0 (2025-10-19) - Initial Release
- ✅ Grid & List View
- ✅ Filter (Alle, Bilder, Videos, Audio, Dokumente)
- ✅ Sortierung (Datum, Name, Größe)
- ✅ Datei-Actions (Öffnen, Download)
- ✅ Statistiken (Anzahl, Größe)
- ✅ Responsive Design
- ✅ Cloud Integration Badge (Teaser)

---

### v2.1.0 (Planned - Q1 2026)
- ⏳ **Datei-Löschen**: Delete-Button mit Bestätigung
- ⏳ **Share-Links**: Temporäre Share-URLs generieren
- ⏳ **Volltext-Suche**: Dateinamen durchsuchen
- ⏳ **Virtual Scrolling**: Performance für >100 Dateien
- ⏳ **Bulk Actions**: Multi-Select + Batch-Operations

### v3.0.0 (Planned - Q2 2026 - Cloud Edition)
- ⏳ **Dropbox Integration**: OAuth2 + File Sync
- ⏳ **Google Drive Integration**: OAuth2 + File Sync
- ⏳ **OneDrive Integration**: OAuth2 + File Sync
- ⏳ **Cloud-Sync Status**: Real-Time Indicator
- ⏳ **Hybrid File Browser**: Chat + Cloud + Projects in einem View

---

**Status**: ✅ **Production Ready** (v2.0)
**Next Milestone**: Delete + Share-Links (v2.1)
**Cloud Edition**: Q2 2026 (v3.0)
**Maintainer**: DegixDAW Team
