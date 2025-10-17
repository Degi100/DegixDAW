-- ============================================
-- MIGRATION 001: Create Music Project Tables
-- SAFE: Only creates new tables, doesn't touch existing ones
-- ============================================

-- PROJECTS Table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  bpm INTEGER DEFAULT 120 CHECK (bpm BETWEEN 20 AND 300),
  time_signature VARCHAR(10) DEFAULT '4/4',
  key VARCHAR(10),
  status VARCHAR(50) DEFAULT 'draft' CHECK (
    status IN ('draft', 'in_progress', 'mixing', 'mastered', 'published', 'archived')
  ),
  version INTEGER DEFAULT 1,
  is_public BOOLEAN DEFAULT false,
  cover_image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb,
  search_vector TSVECTOR
);

COMMENT ON TABLE projects IS 'Music projects created by users';

-- PROJECT_COLLABORATORS Table
CREATE TABLE IF NOT EXISTS project_collaborators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'viewer' CHECK (
    role IN ('viewer', 'contributor', 'mixer', 'admin')
  ),
  can_edit BOOLEAN DEFAULT false,
  can_download BOOLEAN DEFAULT true,
  can_upload_audio BOOLEAN DEFAULT false,
  can_upload_mixdown BOOLEAN DEFAULT false,
  can_comment BOOLEAN DEFAULT true,
  can_invite_others BOOLEAN DEFAULT false,
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

COMMENT ON TABLE project_collaborators IS 'Sharing and permissions for project collaboration';

-- TRACKS Table
CREATE TABLE IF NOT EXISTS tracks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  track_number INTEGER NOT NULL CHECK (track_number >= 1),
  track_type VARCHAR(50) NOT NULL CHECK (
    track_type IN ('midi', 'audio', 'bus', 'fx', 'master')
  ),
  color VARCHAR(7),
  file_path TEXT,
  file_url TEXT,
  file_size BIGINT,
  duration_ms INTEGER,
  midi_data JSONB,
  waveform_data JSONB,
  sample_rate INTEGER,
  bit_depth INTEGER,
  channels INTEGER DEFAULT 2,
  volume_db FLOAT DEFAULT 0.0 CHECK (volume_db BETWEEN -60.0 AND 12.0),
  pan FLOAT DEFAULT 0.0 CHECK (pan BETWEEN -1.0 AND 1.0),
  muted BOOLEAN DEFAULT false,
  soloed BOOLEAN DEFAULT false,
  effects JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

COMMENT ON TABLE tracks IS 'Individual tracks within a project (audio/MIDI/bus/fx)';

-- MIDI_EVENTS Table
CREATE TABLE IF NOT EXISTS midi_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  track_id UUID NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL CHECK (
    event_type IN ('note_on', 'note_off', 'cc', 'pitch_bend', 'program_change', 'aftertouch')
  ),
  timestamp_ms INTEGER NOT NULL CHECK (timestamp_ms >= 0),
  note INTEGER CHECK (note BETWEEN 0 AND 127),
  velocity INTEGER CHECK (velocity BETWEEN 0 AND 127),
  duration_ms INTEGER,
  cc_number INTEGER CHECK (cc_number BETWEEN 0 AND 127),
  cc_value INTEGER CHECK (cc_value BETWEEN 0 AND 127),
  pitch_bend INTEGER CHECK (pitch_bend BETWEEN -8192 AND 8191),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE midi_events IS 'Detailed MIDI events for tracks';

-- MIXDOWNS Table
CREATE TABLE IF NOT EXISTS mixdowns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  file_path TEXT NOT NULL,
  file_url TEXT,
  file_size BIGINT,
  format VARCHAR(10) DEFAULT 'wav' CHECK (format IN ('wav', 'mp3', 'flac', 'aiff')),
  sample_rate INTEGER DEFAULT 44100,
  bit_depth INTEGER DEFAULT 24,
  channels INTEGER DEFAULT 2,
  version_name VARCHAR(255),
  notes TEXT,
  is_final BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE mixdowns IS 'Rendered audio versions of projects';

-- PRESETS Table
CREATE TABLE IF NOT EXISTS presets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  subcategory VARCHAR(100),
  preset_data JSONB NOT NULL,
  file_path TEXT,
  is_public BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  downloads_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  search_vector TSVECTOR
);

COMMENT ON TABLE presets IS 'Shareable FX/instrument presets';

-- TRACK_COMMENTS Table
CREATE TABLE IF NOT EXISTS track_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  track_id UUID NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id),
  content TEXT NOT NULL CHECK (char_length(content) > 0),
  timestamp_ms INTEGER,
  parent_comment_id UUID REFERENCES track_comments(id) ON DELETE CASCADE,
  reactions JSONB DEFAULT '{}'::jsonb,
  is_resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE track_comments IS 'Collaboration comments on tracks';

-- PROJECT_VERSIONS Table
CREATE TABLE IF NOT EXISTS project_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  version_tag VARCHAR(100),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  snapshot_data JSONB NOT NULL,
  changes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, version_number)
);

COMMENT ON TABLE project_versions IS 'Version control snapshots for projects';

-- ============================================
-- VERIFICATION
-- ============================================
-- Run this to verify tables were created:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE '%project%' OR table_name LIKE '%track%' OR table_name LIKE '%preset%';
