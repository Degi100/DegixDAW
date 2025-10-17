# Data Flow - DegixDAW

**Erstellt:** 2025-10-17
**Version:** 1.0

---

## 🔄 User Journey Flows

### Scenario 1: Producer erstellt MIDI-Pattern

```
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 1: MIDI Creation (Browser)                                    │
└─────────────────────────────────────────────────────────────────────┘

User (Browser)                  Supabase                    Database
     │                              │                           │
     │ 1. Open MIDI Editor          │                           │
     │    GET /projects/new         │                           │
     ├──────────────────────────────►│                           │
     │                              │ 2. Verify Auth (JWT)      │
     │                              │ 3. Return blank canvas    │
     │◄─────────────────────────────┤                           │
     │                              │                           │
     │ 4. User places notes         │                           │
     │    (C4, E4, G4 at bar 1)     │                           │
     │    [Client-side only]        │                           │
     │                              │                           │
     │ 5. Click "Save Project"      │                           │
     │    POST /rest/v1/projects    │                           │
     │    Body: {                   │                           │
     │      title: "My Beat",       │                           │
     │      bpm: 120,               │                           │
     │      time_signature: "4/4"   │                           │
     │    }                         │                           │
     ├──────────────────────────────►│                           │
     │                              │ 6. INSERT INTO projects   │
     │                              ├──────────────────────────►│
     │                              │ 7. Return project_id      │
     │                              │◄──────────────────────────┤
     │                              │                           │
     │ 8. Save MIDI Track           │                           │
     │    POST /rest/v1/tracks      │                           │
     │    Body: {                   │                           │
     │      project_id: "xxx",      │                           │
     │      track_type: "midi",     │                           │
     │      midi_data: {...}        │                           │
     │    }                         │                           │
     ├──────────────────────────────►│                           │
     │                              │ 9. INSERT INTO tracks     │
     │                              ├──────────────────────────►│
     │                              │                           │
     │ 10. Export as .mid file      │                           │
     │     POST /storage/upload     │                           │
     │     Path: music-projects/    │                           │
     │           midi/{proj_id}/    │                           │
     │           {track_id}.mid     │                           │
     ├──────────────────────────────►│                           │
     │                              │ 11. Upload to Storage     │
     │                              │     (RLS check)           │
     │                              │ 12. Update track.file_path│
     │                              ├──────────────────────────►│
     │                              │                           │
     │ 13. "Project saved!" Toast   │                           │
     │◄─────────────────────────────┤                           │
     │                              │                           │
     │ 14. Real-time notification   │                           │
     │     to collaborators         │                           │
     │     (via Supabase Realtime)  │                           │
     │◄─────────────────────────────┤                           │
     │                              │                           │
```

---

### Scenario 2: Mix Engineer lädt Projekt in DAW

```
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 2: VST Plugin → DAW Import                                    │
└─────────────────────────────────────────────────────────────────────┘

VST Plugin (Cubase)           Supabase                    DAW
     │                              │                           │
     │ 1. User opens VST in Cubase  │                           │
     │    (Plugin loads)            │                           │
     │                              │                           │
     │ 2. Check saved auth token    │                           │
     │    (from plugin state)       │                           │
     │                              │                           │
     │ 3. If no token: Show Login   │                           │
     │    Click "Login" button      │                           │
     │                              │                           │
     │ 4. Open Browser for OAuth    │                           │
     │    https://degixdaw.com/     │                           │
     │    vst-auth                  │                           │
     ├──────────────────────────────►│                           │
     │                              │ 5. User logs in           │
     │                              │    (email/password)       │
     │                              │ 6. Supabase returns JWT   │
     │                              │ 7. Redirect to:           │
     │                              │    degixdaw://auth?       │
     │                              │    token=xxx              │
     │◄─────────────────────────────┤                           │
     │                              │                           │
     │ 8. Save token (encrypted)    │                           │
     │    in plugin state           │                           │
     │                              │                           │
     │ 9. Fetch Projects            │                           │
     │    GET /rest/v1/projects?    │                           │
     │    select=*,tracks(*)        │                           │
     │    Header: Authorization:    │                           │
     │            Bearer {token}    │                           │
     ├──────────────────────────────►│                           │
     │                              │ 10. RLS check:            │
     │                              │     Is user collaborator? │
     │                              │ 11. Return JSON:          │
     │                              │     [{                    │
     │                              │       id: "xxx",          │
     │                              │       title: "My Beat",   │
     │                              │       tracks: [...]       │
     │                              │     }]                    │
     │ 12. Display in ListBox       │                           │
     │◄─────────────────────────────┤                           │
     │                              │                           │
     │ 13. User selects "My Beat"   │                           │
     │ 14. Click "Load to DAW"      │                           │
     │                              │                           │
     │ 15. For each track:          │                           │
     │     GET signed URL           │                           │
     │     POST /storage/sign       │                           │
     │     Body: {                  │                           │
     │       bucket: "music-proj",  │                           │
     │       path: "midi/xxx.mid"   │                           │
     │     }                        │                           │
     ├──────────────────────────────►│                           │
     │                              │ 16. RLS check + Generate  │
     │                              │     signed URL (1h exp)   │
     │ 17. Return signed URL        │                           │
     │◄─────────────────────────────┤                           │
     │                              │                           │
     │ 18. Download MIDI file       │                           │
     │     GET {signed_url}         │                           │
     ├──────────────────────────────►│                           │
     │ 19. File bytes               │                           │
     │◄─────────────────────────────┤                           │
     │                              │                           │
     │ 20. Save to temp folder      │                           │
     │     C:\Users\...\Temp\       │                           │
     │     degixdaw_xxx.mid         │                           │
     │                              │                           │
     │ 21. Import MIDI to Track 1   │                           │
     │     (via JUCE API)           │                           │
     ├──────────────────────────────────────────────────────────►│
     │                              │                           │
     │ 22. (Repeat for Audio files) │                           │
     │     Import Audio to Track 2  │                           │
     ├──────────────────────────────────────────────────────────►│
     │                              │                           │
     │ 23. Show "Loaded!" message   │                           │
     │                              │                           │
     │                              │     User works in DAW     │
     │                              │     (Add FX, Mix, etc.)   │
     │                              │                           │
```

---

### Scenario 3: Mixdown Upload zurück

```
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 3: Mixdown Upload                                             │
└─────────────────────────────────────────────────────────────────────┘

DAW (Cubase)                  VST Plugin              Supabase
     │                              │                      │
     │ 1. User renders Mixdown      │                      │
     │    File → Export → WAV       │                      │
     │    Output: my_mix.wav        │                      │
     │                              │                      │
     │ 2. Drag WAV to VST Plugin    │                      │
     │    (or click "Upload")       │                      │
     ├──────────────────────────────►│                      │
     │                              │ 3. Read WAV bytes    │
     │                              │    (via JUCE File I/O│
     │                              │                      │
     │                              │ 4. Show progress bar │
     │                              │    "Uploading..."    │
     │                              │                      │
     │                              │ 5. POST /storage/    │
     │                              │    upload            │
     │                              │    Multipart form:   │
     │                              │    - file: {bytes}   │
     │                              │    - path: mixdowns/ │
     │                              │      {proj_id}/      │
     │                              │      {uuid}.wav      │
     │                              ├─────────────────────►│
     │                              │ 6. RLS check:        │
     │                              │    can_upload_mixdown│
     │                              │ 7. Upload to S3      │
     │                              │ 8. Return path       │
     │                              │◄─────────────────────┤
     │                              │                      │
     │                              │ 9. Create DB entry   │
     │                              │    POST /rest/v1/    │
     │                              │    mixdowns          │
     │                              │    Body: {           │
     │                              │      project_id,     │
     │                              │      file_path,      │
     │                              │      version_name,   │
     │                              │      sample_rate,    │
     │                              │      bit_depth       │
     │                              │    }                 │
     │                              ├─────────────────────►│
     │                              │ 10. INSERT mixdown   │
     │                              │ 11. Return mixdown_id│
     │                              │◄─────────────────────┤
     │                              │                      │
     │                              │ 12. Real-time notify │
     │                              │     Producer         │
     │                              │     (Realtime Sub)   │
     │                              │                      │
     │ 13. "Upload success!"        │                      │
     │◄─────────────────────────────┤                      │
     │                              │                      │
```

---

### Scenario 4: Producer hört Mixdown im Browser

```
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 4: Stream Mixdown (Browser)                                   │
└─────────────────────────────────────────────────────────────────────┘

Browser                       Supabase
     │                              │
     │ 1. Notification erscheint:   │
     │    "New mixdown from         │
     │     @mixengineer!"           │
     │◄─────────────────────────────┤ (Realtime WebSocket)
     │                              │
     │ 2. User clicks notification  │
     │    → Opens Project Page      │
     │                              │
     │ 3. GET /rest/v1/mixdowns?    │
     │    project_id=eq.xxx         │
     ├──────────────────────────────►│
     │                              │ 4. RLS check:
     │                              │    Is collaborator?
     │ 5. Return mixdowns:          │
     │    [{                        │
     │      id: "yyy",              │
     │      file_path: "mixdowns/..│
     │      version_name: "Club Mix"│
     │    }]                        │
     │◄─────────────────────────────┤
     │                              │
     │ 6. Generate signed URL       │
     │    POST /storage/sign        │
     ├──────────────────────────────►│
     │ 7. Return signed URL         │
     │    (expires in 1h)           │
     │◄─────────────────────────────┤
     │                              │
     │ 8. Display Audio Player:     │
     │    <audio src={signedUrl}>   │
     │                              │
     │ 9. User clicks Play          │
     │    → Stream from signed URL  │
     │                              │
     │ 10. (Optional) Download      │
     │     GET {signedUrl}          │
     │     → Save as "my_mix.wav"   │
     │                              │
```

---

## 🔐 Authentication Flows

### Browser Login (Email/Password)

```
┌─────────────────────────────────────────────────────────────────────┐
│  Email/Password Auth                                                │
└─────────────────────────────────────────────────────────────────────┘

Browser                       Supabase Auth            Database
     │                              │                      │
     │ 1. User enters credentials   │                      │
     │    POST /auth/v1/token       │                      │
     │    Body: {                   │                      │
     │      email: "user@ex.com",   │                      │
     │      password: "xxx"         │                      │
     │    }                         │                      │
     ├──────────────────────────────►│                      │
     │                              │ 2. Verify password   │
     │                              │    (bcrypt hash)     │
     │                              │                      │
     │                              │ 3. If valid:         │
     │                              │    - Generate JWT    │
     │                              │    - Generate Refresh│
     │                              │      Token           │
     │                              │                      │
     │ 4. Return tokens:            │                      │
     │    {                         │                      │
     │      access_token: "eyJ...", │                      │
     │      refresh_token: "xxx",   │                      │
     │      expires_in: 3600        │                      │
     │    }                         │                      │
     │◄─────────────────────────────┤                      │
     │                              │                      │
     │ 5. Save tokens in:           │                      │
     │    - localStorage (access)   │                      │
     │    - httpOnly cookie (refresh│                      │
     │                              │                      │
     │ 6. Fetch user profile        │                      │
     │    GET /rest/v1/profiles?    │                      │
     │    id=eq.{user_id}           │                      │
     │    Header: Authorization:    │                      │
     │            Bearer {token}    │                      │
     ├──────────────────────────────►│                      │
     │                              │ 7. SELECT * FROM     │
     │                              │    profiles          │
     │                              ├─────────────────────►│
     │ 8. Return profile            │◄─────────────────────┤
     │◄─────────────────────────────┤                      │
     │                              │                      │
     │ 9. Redirect to /dashboard    │                      │
     │                              │                      │
```

### VST Plugin OAuth Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│  OAuth2 Flow for VST Plugin                                         │
└─────────────────────────────────────────────────────────────────────┘

VST Plugin              Browser              Supabase
     │                      │                      │
     │ 1. User clicks Login │                      │
     │    in VST UI         │                      │
     │                      │                      │
     │ 2. Generate state    │                      │
     │    (CSRF protection) │                      │
     │                      │                      │
     │ 3. Open Browser:     │                      │
     │    https://degixdaw. │                      │
     │    com/vst-auth?     │                      │
     │    state={random}    │                      │
     ├─────────────────────►│                      │
     │                      │ 4. User logs in      │
     │                      │    (email/password)  │
     │                      ├─────────────────────►│
     │                      │ 5. Return JWT        │
     │                      │◄─────────────────────┤
     │                      │                      │
     │                      │ 6. Redirect to:      │
     │                      │    degixdaw://auth?  │
     │                      │    token=xxx&        │
     │                      │    state={random}    │
     │                      │                      │
     │ 7. Intercept callback│                      │
     │    (Custom URL scheme│                      │
     │◄─────────────────────┤                      │
     │                      │                      │
     │ 8. Verify state      │                      │
     │    (CSRF check)      │                      │
     │                      │                      │
     │ 9. Save token        │                      │
     │    (AES-256 encrypt) │                      │
     │    in plugin state   │                      │
     │                      │                      │
     │ 10. Validate token   │                      │
     │     GET /auth/v1/user│                      │
     ├──────────────────────────────────────────────►
     │ 11. Return user info │                      │
     │◄──────────────────────────────────────────────
     │                      │                      │
     │ 12. Update UI:       │                      │
     │     "Logged in as    │                      │
     │      @username"      │                      │
     │                      │                      │
```

### Token Refresh (Auto)

```
Browser/VST                   Supabase Auth
     │                              │
     │ 1. Access token expires      │
     │    (after 1 hour)            │
     │                              │
     │ 2. API request fails:        │
     │    GET /rest/v1/projects     │
     ├──────────────────────────────►│
     │ 3. Return 401 Unauthorized   │
     │◄─────────────────────────────┤
     │                              │
     │ 4. Auto-refresh:             │
     │    POST /auth/v1/token?      │
     │    grant_type=refresh_token  │
     │    Body: {                   │
     │      refresh_token: "xxx"    │
     │    }                         │
     ├──────────────────────────────►│
     │ 5. Return new access token   │
     │◄─────────────────────────────┤
     │                              │
     │ 6. Retry original request    │
     │    with new token            │
     ├──────────────────────────────►│
     │ 7. Success!                  │
     │◄─────────────────────────────┤
     │                              │
```

---

## 📡 Real-time Subscriptions

### New Mixdown Notification

```
┌─────────────────────────────────────────────────────────────────────┐
│  Real-time Notification (Supabase Realtime)                         │
└─────────────────────────────────────────────────────────────────────┘

Browser                       Supabase Realtime        Database
     │                              │                      │
     │ 1. Subscribe to channel:     │                      │
     │    supabase.channel(         │                      │
     │      'project:xxx'           │                      │
     │    ).on('postgres_changes',  │                      │
     │      { table: 'mixdowns' }   │                      │
     │    )                         │                      │
     ├──────────────────────────────►│                      │
     │                              │ 2. WebSocket open    │
     │◄─────────────────────────────┤                      │
     │                              │                      │
     │                              │ 3. Database Trigger: │
     │                              │    New mixdown       │
     │                              │    inserted          │
     │                              │◄─────────────────────┤
     │                              │                      │
     │ 4. Push notification:        │                      │
     │    {                         │                      │
     │      event: 'INSERT',        │                      │
     │      table: 'mixdowns',      │                      │
     │      new: {                  │                      │
     │        id: "yyy",            │                      │
     │        project_id: "xxx",    │                      │
     │        created_by: "zzz"     │                      │
     │      }                       │                      │
     │    }                         │                      │
     │◄─────────────────────────────┤                      │
     │                              │                      │
     │ 5. Show Toast:               │                      │
     │    "New mixdown from         │                      │
     │     @mixengineer!"           │                      │
     │                              │                      │
```

### Collaborator Joins Project

```
Browser (Producer)            Supabase Realtime        Database
     │                              │                      │
     │ 1. Subscribe to:             │                      │
     │    'project_collaborators'   │                      │
     ├──────────────────────────────►│                      │
     │                              │                      │
     │                              │ 2. New collaborator  │
     │                              │    accepts invite    │
     │                              │◄─────────────────────┤
     │                              │    UPDATE accepted_at│
     │                              │                      │
     │ 3. Push notification:        │                      │
     │    {                         │                      │
     │      event: 'UPDATE',        │                      │
     │      new: {                  │                      │
     │        user_id: "abc",       │                      │
     │        accepted_at: "..."    │                      │
     │      }                       │                      │
     │    }                         │                      │
     │◄─────────────────────────────┤                      │
     │                              │                      │
     │ 4. Fetch user profile        │                      │
     │ 5. Show notification         │                      │
     │                              │                      │
```

---

## 🗂️ State Management

### Frontend State (React)

```typescript
// Context Structure

AuthContext
├─ user: User | null
├─ session: Session | null
└─ loading: boolean

ProjectContext
├─ projects: Project[]
├─ currentProject: Project | null
├─ tracks: Track[]
└─ selectedTrack: Track | null

MIDIContext
├─ notes: MIDINote[]
├─ playbackPosition: number
├─ isPlaying: boolean
└─ bpm: number

CollaborationContext
├─ collaborators: User[]
├─ comments: Comment[]
└─ onlineUsers: string[]

ChatContext
├─ conversations: Conversation[]
├─ messages: Message[]
└─ unreadCount: number
```

### VST Plugin State (C++)

```cpp
// Plugin Processor State

struct PluginState {
    // Auth
    std::string authToken;
    std::string refreshToken;
    std::string userId;
    bool isAuthenticated;

    // Projects
    std::vector<ProjectInfo> projects;
    std::optional<ProjectInfo> selectedProject;

    // Download Cache
    std::map<std::string, juce::File> downloadedFiles;

    // Settings
    bool autoLogin;
    std::string lastProjectId;
};
```

---

## 📊 API Endpoints Summary

### REST API (Supabase PostgREST)

```
Auth:
POST   /auth/v1/token              - Login
POST   /auth/v1/token?grant_type   - Refresh token
GET    /auth/v1/user               - Get current user
POST   /auth/v1/logout             - Logout

Projects:
GET    /rest/v1/projects           - List projects
POST   /rest/v1/projects           - Create project
GET    /rest/v1/projects?id=eq.x   - Get project
PATCH  /rest/v1/projects?id=eq.x   - Update project
DELETE /rest/v1/projects?id=eq.x   - Delete project

Tracks:
GET    /rest/v1/tracks?project_id  - List tracks
POST   /rest/v1/tracks             - Create track
PATCH  /rest/v1/tracks?id=eq.x     - Update track
DELETE /rest/v1/tracks?id=eq.x     - Delete track

Mixdowns:
GET    /rest/v1/mixdowns?project_id - List mixdowns
POST   /rest/v1/mixdowns            - Create mixdown
DELETE /rest/v1/mixdowns?id=eq.x    - Delete mixdown

Presets:
GET    /rest/v1/presets?is_public  - Browse public presets
POST   /rest/v1/presets            - Create preset
GET    /rest/v1/presets?id=eq.x    - Get preset
DELETE /rest/v1/presets?id=eq.x    - Delete preset

Storage:
POST   /storage/v1/upload          - Upload file
GET    /storage/v1/object/{path}   - Download file
POST   /storage/v1/sign/{path}     - Get signed URL
DELETE /storage/v1/object/{path}   - Delete file
```

---

## 🔄 Data Synchronization

### Browser → VST Plugin

```
Keine direkte Kommunikation!
Beide kommunizieren nur mit Supabase.

Sync via Polling (VST Plugin):
- Alle 5 Minuten: Fetch neue Projects
- Bei User-Action: Fetch on-demand
- Real-time nicht möglich in VST (kein WebSocket)
```

### Offline Support (Future)

```
Browser:
- Service Worker für Offline-Caching
- IndexedDB für lokale Projekte
- Sync Queue für Uploads

VST Plugin:
- Lokale Projekt-Datenbank (SQLite)
- Sync Queue für Mixdown-Uploads
- Conflict Resolution
```

---

## 🎯 Performance Optimizations

### Pagination

```typescript
// Frontend: Load projects in batches
const { data, error } = await supabase
  .from('projects')
  .select('*')
  .range(0, 9) // Load 10 at a time
  .order('updated_at', { ascending: false });
```

### Caching

```typescript
// Frontend: React Query for caching
const { data } = useQuery(
  ['projects', userId],
  fetchProjects,
  { staleTime: 5 * 60 * 1000 } // 5 minutes
);
```

### Lazy Loading

```typescript
// Frontend: Load tracks only when project opens
const loadProject = async (projectId: string) => {
  // First: Load project metadata
  const project = await fetchProject(projectId);

  // Then: Load tracks on-demand
  const tracks = await fetchTracks(projectId);
};
```

---

**See also:**
- [02_DATABASE_SCHEMA.md](02_DATABASE_SCHEMA.md) - Database structure
- [04_STORAGE_STRATEGY.md](04_STORAGE_STRATEGY.md) - File storage
- [05_VST_PLUGIN.md](05_VST_PLUGIN.md) - VST implementation
