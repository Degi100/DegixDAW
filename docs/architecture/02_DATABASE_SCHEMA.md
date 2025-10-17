# Database Schema - DegixDAW

**Erstellt:** 2025-10-17
**Version:** 1.0

---

## 🗄️ Complete SQL Schema

### Übersicht

```
Music Projects System:
├─ projects              // Hauptprojekte
├─ project_collaborators // Sharing & Permissions
├─ tracks                // Audio/MIDI Tracks
├─ midi_events           // Detaillierte MIDI Daten
├─ mixdowns              // Rendered Versions
├─ presets               // FX/Instrument Presets
├─ track_comments        // Collaboration Comments
└─ project_versions      // Version Control

Existing Tables (Chat/Social):
├─ profiles              ✅
├─ conversations         ✅
├─ conversation_members  ✅
├─ messages              ✅
├─ friendships           ✅
├─ issues                ✅
└─ feature_flags         ✅
```

---

## 📦 PROJECTS Table

```sql
-- ============================================
-- PROJECTS (Music Projects)
-- ============================================
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Ownership
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Metadata
  title VARCHAR(255) NOT NULL,
  description TEXT,
  bpm INTEGER DEFAULT 120 CHECK (bpm BETWEEN 20 AND 300),
  time_signature VARCHAR(10) DEFAULT '4/4',
  key VARCHAR(10), -- e.g., 'C', 'Am', 'F#m', 'C# minor'

  -- Status
  status VARCHAR(50) DEFAULT 'draft' CHECK (
    status IN ('draft', 'in_progress', 'mixing', 'mastered', 'published', 'archived')
  ),
  version INTEGER DEFAULT 1,

  -- Visibility
  is_public BOOLEAN DEFAULT false,

  -- Cover Art
  cover_image_url TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Metadata JSON (for future extensibility)
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Full-text search
  search_vector TSVECTOR
);

-- Indexes
CREATE INDEX idx_projects_creator ON projects(creator_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_public ON projects(is_public) WHERE is_public = true;
CREATE INDEX idx_projects_search ON projects USING GIN(search_vector);

-- Updated_at Trigger
CREATE OR REPLACE FUNCTION update_projects_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER projects_updated_at
BEFORE UPDATE ON projects
FOR EACH ROW
EXECUTE FUNCTION update_projects_updated_at();

-- Full-text Search Trigger
CREATE OR REPLACE FUNCTION update_projects_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER projects_search_vector_update
BEFORE INSERT OR UPDATE ON projects
FOR EACH ROW
EXECUTE FUNCTION update_projects_search_vector();

-- Comments
COMMENT ON TABLE projects IS 'Music projects created by users';
COMMENT ON COLUMN projects.bpm IS 'Beats per minute (20-300)';
COMMENT ON COLUMN projects.time_signature IS 'e.g., 4/4, 3/4, 7/8';
COMMENT ON COLUMN projects.key IS 'Musical key, e.g., C, Am, F#m';
COMMENT ON COLUMN projects.status IS 'Workflow status: draft → in_progress → mixing → mastered → published';
```

---

## 👥 PROJECT_COLLABORATORS Table

```sql
-- ============================================
-- PROJECT_COLLABORATORS (Sharing & Permissions)
-- ============================================
CREATE TABLE project_collaborators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Role
  role VARCHAR(50) DEFAULT 'viewer' CHECK (
    role IN ('viewer', 'contributor', 'mixer', 'admin')
  ),

  -- Granular Permissions
  can_edit BOOLEAN DEFAULT false,
  can_download BOOLEAN DEFAULT true,
  can_upload_audio BOOLEAN DEFAULT false,
  can_upload_mixdown BOOLEAN DEFAULT false,
  can_comment BOOLEAN DEFAULT true,
  can_invite_others BOOLEAN DEFAULT false,

  -- Invitation Status
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(project_id, user_id)
);

-- Indexes
CREATE INDEX idx_collaborators_project ON project_collaborators(project_id);
CREATE INDEX idx_collaborators_user ON project_collaborators(user_id);
CREATE INDEX idx_collaborators_role ON project_collaborators(role);

-- Comments
COMMENT ON TABLE project_collaborators IS 'Sharing and permissions for project collaboration';
COMMENT ON COLUMN project_collaborators.role IS 'viewer: read-only, contributor: can edit, mixer: can upload mixdowns, admin: full control';
```

---

## 🎵 TRACKS Table

```sql
-- ============================================
-- TRACKS (Audio/MIDI Tracks in Project)
-- ============================================
CREATE TABLE tracks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  -- Track Info
  name VARCHAR(255) NOT NULL,
  track_number INTEGER NOT NULL CHECK (track_number >= 1),
  track_type VARCHAR(50) NOT NULL CHECK (
    track_type IN ('midi', 'audio', 'bus', 'fx', 'master')
  ),
  color VARCHAR(7), -- Hex color for UI, e.g., '#FF5733'

  -- File References (Supabase Storage)
  file_path TEXT, -- Path in Supabase Storage: music-projects/audio/{project_id}/{track_id}.wav
  file_url TEXT, -- Signed URL (generated on-demand, not stored long-term)
  file_size BIGINT, -- Bytes
  duration_ms INTEGER, -- Milliseconds

  -- MIDI-specific (for small inline MIDI)
  midi_data JSONB, -- Inline MIDI events (for patterns < 1KB)

  -- Audio-specific
  waveform_data JSONB, -- Pre-computed peaks for UI visualization
  sample_rate INTEGER, -- e.g., 44100, 48000
  bit_depth INTEGER, -- e.g., 16, 24
  channels INTEGER DEFAULT 2, -- 1=mono, 2=stereo

  -- Mixing Parameters
  volume_db FLOAT DEFAULT 0.0 CHECK (volume_db BETWEEN -60.0 AND 12.0),
  pan FLOAT DEFAULT 0.0 CHECK (pan BETWEEN -1.0 AND 1.0), -- -1.0 (left) to 1.0 (right)
  muted BOOLEAN DEFAULT false,
  soloed BOOLEAN DEFAULT false,

  -- FX Chain (Array of effect preset IDs or inline parameters)
  effects JSONB DEFAULT '[]'::jsonb, -- e.g., [{"type": "eq", "params": {...}}, ...]

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Indexes
CREATE INDEX idx_tracks_project ON tracks(project_id);
CREATE INDEX idx_tracks_type ON tracks(track_type);
CREATE INDEX idx_tracks_number ON tracks(project_id, track_number);

-- Updated_at Trigger
CREATE TRIGGER tracks_updated_at
BEFORE UPDATE ON tracks
FOR EACH ROW
EXECUTE FUNCTION update_projects_updated_at(); -- Reuse function

-- Comments
COMMENT ON TABLE tracks IS 'Individual tracks within a project (audio/MIDI/bus/fx)';
COMMENT ON COLUMN tracks.track_type IS 'midi: MIDI data, audio: WAV/MP3, bus: submix, fx: effect return, master: master track';
COMMENT ON COLUMN tracks.midi_data IS 'Inline MIDI events for small patterns (use midi_events table for larger data)';
COMMENT ON COLUMN tracks.waveform_data IS 'Pre-computed waveform peaks for UI (e.g., [0.5, 0.7, 0.3, ...])';
```

---

## 🎹 MIDI_EVENTS Table

```sql
-- ============================================
-- MIDI_EVENTS (Detailed MIDI Events)
-- ============================================
CREATE TABLE midi_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  track_id UUID NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,

  -- MIDI Event Type
  event_type VARCHAR(50) NOT NULL CHECK (
    event_type IN ('note_on', 'note_off', 'cc', 'pitch_bend', 'program_change', 'aftertouch')
  ),

  -- Timing
  timestamp_ms INTEGER NOT NULL CHECK (timestamp_ms >= 0), -- Position in track (milliseconds)

  -- Note Events (note_on, note_off)
  note INTEGER CHECK (note BETWEEN 0 AND 127), -- MIDI note number (C-2 = 0, G8 = 127)
  velocity INTEGER CHECK (velocity BETWEEN 0 AND 127), -- Note velocity
  duration_ms INTEGER, -- Duration for note_on events (optional, can be calculated)

  -- Control Change (cc)
  cc_number INTEGER CHECK (cc_number BETWEEN 0 AND 127), -- Controller number
  cc_value INTEGER CHECK (cc_value BETWEEN 0 AND 127), -- Controller value

  -- Pitch Bend
  pitch_bend INTEGER CHECK (pitch_bend BETWEEN -8192 AND 8191), -- -8192 to +8191

  -- Metadata (for extensibility)
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_midi_track ON midi_events(track_id);
CREATE INDEX idx_midi_timestamp ON midi_events(track_id, timestamp_ms);

-- Comments
COMMENT ON TABLE midi_events IS 'Detailed MIDI events for tracks (use for complex MIDI data)';
COMMENT ON COLUMN midi_events.timestamp_ms IS 'Position in track timeline (milliseconds from start)';
COMMENT ON COLUMN midi_events.note IS 'MIDI note number (0-127), where 60 = C4';
```

---

## 🎚️ MIXDOWNS Table

```sql
-- ============================================
-- MIXDOWNS (Rendered Versions)
-- ============================================
CREATE TABLE mixdowns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  -- Creator
  created_by UUID NOT NULL REFERENCES auth.users(id),

  -- File Info
  file_path TEXT NOT NULL, -- Supabase Storage path: music-projects/mixdowns/{project_id}/{mixdown_id}.wav
  file_url TEXT, -- Signed URL (generated on-demand)
  file_size BIGINT,
  format VARCHAR(10) DEFAULT 'wav' CHECK (format IN ('wav', 'mp3', 'flac', 'aiff')),

  -- Audio Specs
  sample_rate INTEGER DEFAULT 44100,
  bit_depth INTEGER DEFAULT 24,
  channels INTEGER DEFAULT 2, -- 1=mono, 2=stereo, 6=5.1, etc.

  -- Metadata
  version_name VARCHAR(255), -- e.g., "Club Mix", "Radio Edit", "Instrumental"
  notes TEXT, -- Mix notes (e.g., "Boosted bass at 2:30")

  -- Status
  is_final BOOLEAN DEFAULT false, -- Mark as "final" version

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_mixdowns_project ON mixdowns(project_id);
CREATE INDEX idx_mixdowns_creator ON mixdowns(created_by);
CREATE INDEX idx_mixdowns_final ON mixdowns(is_final) WHERE is_final = true;

-- Comments
COMMENT ON TABLE mixdowns IS 'Rendered audio versions of projects';
COMMENT ON COLUMN mixdowns.version_name IS 'Human-readable version name (e.g., "Radio Edit")';
COMMENT ON COLUMN mixdowns.is_final IS 'Mark as the final/official version';
```

---

## 🎛️ PRESETS Table

```sql
-- ============================================
-- PRESETS (FX/Instrument Presets)
-- ============================================
CREATE TABLE presets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Creator
  created_by UUID NOT NULL REFERENCES auth.users(id),

  -- Preset Info
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100), -- e.g., 'eq', 'compressor', 'reverb', 'synth', 'drum_kit'
  subcategory VARCHAR(100), -- e.g., 'vintage', 'modern', 'experimental'

  -- Preset Data (VST parameter values or plugin-specific JSON)
  preset_data JSONB NOT NULL,

  -- File Reference (optional, for complex presets)
  file_path TEXT, -- Supabase Storage: music-projects/presets/{user_id}/{preset_id}.json

  -- Visibility
  is_public BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false, -- Featured presets (curated by admins)

  -- Stats
  downloads_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,

  -- Tags for search
  tags TEXT[], -- e.g., ['club', 'bass', 'punchy', 'vintage']

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Full-text search
  search_vector TSVECTOR
);

-- Indexes
CREATE INDEX idx_presets_creator ON presets(created_by);
CREATE INDEX idx_presets_category ON presets(category);
CREATE INDEX idx_presets_tags ON presets USING GIN(tags);
CREATE INDEX idx_presets_public ON presets(is_public) WHERE is_public = true;
CREATE INDEX idx_presets_featured ON presets(is_featured) WHERE is_featured = true;
CREATE INDEX idx_presets_search ON presets USING GIN(search_vector);

-- Full-text Search Trigger
CREATE TRIGGER presets_search_vector_update
BEFORE INSERT OR UPDATE ON presets
FOR EACH ROW
EXECUTE FUNCTION update_projects_search_vector(); -- Reuse function

-- Comments
COMMENT ON TABLE presets IS 'Shareable FX/instrument presets';
COMMENT ON COLUMN presets.category IS 'Main category: eq, compressor, reverb, synth, drum_kit, etc.';
COMMENT ON COLUMN presets.preset_data IS 'JSON with plugin parameters or DAW-specific preset data';
```

---

## 💬 TRACK_COMMENTS Table

```sql
-- ============================================
-- TRACK_COMMENTS (Collaboration Comments)
-- ============================================
CREATE TABLE track_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  track_id UUID NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,

  -- Author
  author_id UUID NOT NULL REFERENCES auth.users(id),

  -- Comment
  content TEXT NOT NULL CHECK (char_length(content) > 0),
  timestamp_ms INTEGER, -- Position in track (optional, for time-based comments)

  -- Thread Support
  parent_comment_id UUID REFERENCES track_comments(id) ON DELETE CASCADE,

  -- Reactions
  reactions JSONB DEFAULT '{}'::jsonb, -- e.g., {"👍": 5, "🔥": 2}

  -- Status
  is_resolved BOOLEAN DEFAULT false, -- For actionable comments (e.g., "Fix this note")

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_comments_track ON track_comments(track_id);
CREATE INDEX idx_comments_author ON track_comments(author_id);
CREATE INDEX idx_comments_parent ON track_comments(parent_comment_id);
CREATE INDEX idx_comments_timestamp ON track_comments(track_id, timestamp_ms);

-- Comments
COMMENT ON TABLE track_comments IS 'Collaboration comments on tracks';
COMMENT ON COLUMN track_comments.timestamp_ms IS 'Optional: position in track for time-based comments';
COMMENT ON COLUMN track_comments.is_resolved IS 'Mark comment as resolved (useful for feedback/tasks)';
```

---

## 📚 PROJECT_VERSIONS Table

```sql
-- ============================================
-- PROJECT_VERSIONS (Version Control)
-- ============================================
CREATE TABLE project_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  -- Version Info
  version_number INTEGER NOT NULL,
  version_tag VARCHAR(100), -- e.g., "v1.0", "beta", "final"
  created_by UUID NOT NULL REFERENCES auth.users(id),

  -- Snapshot Data (Complete project state)
  snapshot_data JSONB NOT NULL, -- Full project + tracks + metadata

  -- Changelog
  changes TEXT, -- Human-readable changelog

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(project_id, version_number)
);

-- Indexes
CREATE INDEX idx_versions_project ON project_versions(project_id);
CREATE INDEX idx_versions_number ON project_versions(project_id, version_number DESC);

-- Comments
COMMENT ON TABLE project_versions IS 'Version control snapshots for projects';
COMMENT ON COLUMN project_versions.snapshot_data IS 'Complete JSON snapshot (project + tracks + settings)';
```

---

## 🔐 Row-Level Security (RLS) Policies

### PROJECTS Policies

```sql
-- Enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own projects + shared projects
CREATE POLICY "users_read_own_and_shared_projects"
ON projects FOR SELECT
TO authenticated
USING (
  creator_id = auth.uid() OR
  id IN (
    SELECT project_id FROM project_collaborators
    WHERE user_id = auth.uid() AND accepted_at IS NOT NULL
  ) OR
  is_public = true
);

-- Policy: Users can create projects
CREATE POLICY "users_create_projects"
ON projects FOR INSERT
TO authenticated
WITH CHECK (creator_id = auth.uid());

-- Policy: Only creator can update
CREATE POLICY "creator_update_project"
ON projects FOR UPDATE
TO authenticated
USING (creator_id = auth.uid())
WITH CHECK (creator_id = auth.uid());

-- Policy: Only creator can delete
CREATE POLICY "creator_delete_project"
ON projects FOR DELETE
TO authenticated
USING (creator_id = auth.uid());
```

### PROJECT_COLLABORATORS Policies

```sql
ALTER TABLE project_collaborators ENABLE ROW LEVEL SECURITY;

-- Read: User can see collaborators of their projects
CREATE POLICY "users_read_collaborators"
ON project_collaborators FOR SELECT
TO authenticated
USING (
  project_id IN (
    SELECT id FROM projects WHERE creator_id = auth.uid()
  ) OR
  user_id = auth.uid()
);

-- Insert: Only project creator or admins can add collaborators
CREATE POLICY "creator_invite_collaborators"
ON project_collaborators FOR INSERT
TO authenticated
WITH CHECK (
  project_id IN (
    SELECT id FROM projects WHERE creator_id = auth.uid()
  ) OR
  project_id IN (
    SELECT project_id FROM project_collaborators
    WHERE user_id = auth.uid() AND can_invite_others = true
  )
);

-- Update: Only project creator can change permissions
CREATE POLICY "creator_update_collaborators"
ON project_collaborators FOR UPDATE
TO authenticated
USING (
  project_id IN (
    SELECT id FROM projects WHERE creator_id = auth.uid()
  )
);

-- Delete: Creator can remove collaborators, users can leave
CREATE POLICY "creator_or_self_delete_collaborator"
ON project_collaborators FOR DELETE
TO authenticated
USING (
  project_id IN (
    SELECT id FROM projects WHERE creator_id = auth.uid()
  ) OR
  user_id = auth.uid()
);
```

### TRACKS Policies

```sql
ALTER TABLE tracks ENABLE ROW LEVEL SECURITY;

-- Inherit project permissions
CREATE POLICY "users_read_project_tracks"
ON tracks FOR SELECT
TO authenticated
USING (
  project_id IN (
    SELECT id FROM projects WHERE creator_id = auth.uid()
  ) OR
  project_id IN (
    SELECT project_id FROM project_collaborators
    WHERE user_id = auth.uid() AND accepted_at IS NOT NULL
  )
);

-- Contributors can create tracks
CREATE POLICY "contributors_create_tracks"
ON tracks FOR INSERT
TO authenticated
WITH CHECK (
  project_id IN (
    SELECT project_id FROM project_collaborators
    WHERE user_id = auth.uid() AND can_edit = true
  ) OR
  project_id IN (
    SELECT id FROM projects WHERE creator_id = auth.uid()
  )
);

-- Contributors can update tracks
CREATE POLICY "contributors_update_tracks"
ON tracks FOR UPDATE
TO authenticated
USING (
  project_id IN (
    SELECT project_id FROM project_collaborators
    WHERE user_id = auth.uid() AND can_edit = true
  ) OR
  project_id IN (
    SELECT id FROM projects WHERE creator_id = auth.uid()
  )
);

-- Only creator or track creator can delete
CREATE POLICY "creator_delete_tracks"
ON tracks FOR DELETE
TO authenticated
USING (
  project_id IN (
    SELECT id FROM projects WHERE creator_id = auth.uid()
  ) OR
  created_by = auth.uid()
);
```

### MIXDOWNS Policies

```sql
ALTER TABLE mixdowns ENABLE ROW LEVEL SECURITY;

-- Read: Collaborators can read mixdowns
CREATE POLICY "collaborators_read_mixdowns"
ON mixdowns FOR SELECT
TO authenticated
USING (
  project_id IN (
    SELECT id FROM projects WHERE creator_id = auth.uid()
  ) OR
  project_id IN (
    SELECT project_id FROM project_collaborators
    WHERE user_id = auth.uid() AND can_download = true
  )
);

-- Insert: Mixers can upload mixdowns
CREATE POLICY "mixers_upload_mixdowns"
ON mixdowns FOR INSERT
TO authenticated
WITH CHECK (
  project_id IN (
    SELECT project_id FROM project_collaborators
    WHERE user_id = auth.uid() AND can_upload_mixdown = true
  ) OR
  project_id IN (
    SELECT id FROM projects WHERE creator_id = auth.uid()
  )
);

-- Update: Creator or mixdown creator can update
CREATE POLICY "creator_update_mixdowns"
ON mixdowns FOR UPDATE
TO authenticated
USING (created_by = auth.uid());

-- Delete: Creator or mixdown creator can delete
CREATE POLICY "creator_delete_mixdowns"
ON mixdowns FOR DELETE
TO authenticated
USING (created_by = auth.uid());
```

### PRESETS Policies

```sql
ALTER TABLE presets ENABLE ROW LEVEL SECURITY;

-- Read: Public presets or own presets
CREATE POLICY "users_read_public_presets"
ON presets FOR SELECT
TO authenticated
USING (is_public = true OR created_by = auth.uid());

-- Insert: Authenticated users can create presets
CREATE POLICY "users_create_presets"
ON presets FOR INSERT
TO authenticated
WITH CHECK (created_by = auth.uid());

-- Update: Only creator can update
CREATE POLICY "creator_update_presets"
ON presets FOR UPDATE
TO authenticated
USING (created_by = auth.uid());

-- Delete: Only creator can delete
CREATE POLICY "creator_delete_presets"
ON presets FOR DELETE
TO authenticated
USING (created_by = auth.uid());
```

---

## 🔄 Database Functions

### Get User Projects with Stats

```sql
CREATE OR REPLACE FUNCTION get_user_projects_with_stats(user_uuid UUID)
RETURNS TABLE (
  id UUID,
  title VARCHAR,
  description TEXT,
  status VARCHAR,
  bpm INTEGER,
  track_count BIGINT,
  collaborator_count BIGINT,
  mixdown_count BIGINT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.title,
    p.description,
    p.status,
    p.bpm,
    COUNT(DISTINCT t.id) AS track_count,
    COUNT(DISTINCT pc.user_id) AS collaborator_count,
    COUNT(DISTINCT m.id) AS mixdown_count,
    p.created_at,
    p.updated_at
  FROM projects p
  LEFT JOIN tracks t ON t.project_id = p.id
  LEFT JOIN project_collaborators pc ON pc.project_id = p.id
  LEFT JOIN mixdowns m ON m.project_id = p.id
  WHERE p.creator_id = user_uuid
     OR p.id IN (SELECT project_id FROM project_collaborators WHERE user_id = user_uuid)
  GROUP BY p.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 📊 Example Queries

### Get all projects with collaborator info

```sql
SELECT
  p.id,
  p.title,
  p.creator_id,
  prof.username AS creator_username,
  COUNT(DISTINCT pc.user_id) AS collaborator_count,
  COUNT(DISTINCT t.id) AS track_count,
  p.created_at
FROM projects p
JOIN profiles prof ON prof.id = p.creator_id
LEFT JOIN project_collaborators pc ON pc.project_id = p.id
LEFT JOIN tracks t ON t.project_id = p.id
WHERE p.is_public = true
GROUP BY p.id, prof.username;
```

### Get MIDI events for a track (sorted by time)

```sql
SELECT
  event_type,
  timestamp_ms,
  note,
  velocity,
  duration_ms
FROM midi_events
WHERE track_id = 'xxx-xxx-xxx'
ORDER BY timestamp_ms ASC;
```

### Get latest mixdown for each project

```sql
SELECT DISTINCT ON (project_id)
  project_id,
  id AS mixdown_id,
  version_name,
  created_at
FROM mixdowns
ORDER BY project_id, created_at DESC;
```

---

## 🚀 Next Steps

1. **Run migrations:** Create all tables in Supabase
2. **Test RLS policies:** Verify permissions work correctly
3. **Seed test data:** Add sample projects for development
4. **Setup Storage buckets:** See [04_STORAGE_STRATEGY.md](04_STORAGE_STRATEGY.md)

---

**See also:**
- [04_STORAGE_STRATEGY.md](04_STORAGE_STRATEGY.md) - Storage buckets & policies
- [03_DATA_FLOW.md](03_DATA_FLOW.md) - How data flows through the system
