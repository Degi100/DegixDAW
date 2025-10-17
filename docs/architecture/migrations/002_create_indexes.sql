-- ============================================
-- MIGRATION 002: Create Indexes
-- SAFE: Only creates indexes for performance
-- ============================================

-- PROJECTS Indexes
CREATE INDEX IF NOT EXISTS idx_projects_creator ON projects(creator_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_public ON projects(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_projects_search ON projects USING GIN(search_vector);

-- PROJECT_COLLABORATORS Indexes
CREATE INDEX IF NOT EXISTS idx_collaborators_project ON project_collaborators(project_id);
CREATE INDEX IF NOT EXISTS idx_collaborators_user ON project_collaborators(user_id);
CREATE INDEX IF NOT EXISTS idx_collaborators_role ON project_collaborators(role);

-- TRACKS Indexes
CREATE INDEX IF NOT EXISTS idx_tracks_project ON tracks(project_id);
CREATE INDEX IF NOT EXISTS idx_tracks_type ON tracks(track_type);
CREATE INDEX IF NOT EXISTS idx_tracks_number ON tracks(project_id, track_number);

-- MIDI_EVENTS Indexes
CREATE INDEX IF NOT EXISTS idx_midi_track ON midi_events(track_id);
CREATE INDEX IF NOT EXISTS idx_midi_timestamp ON midi_events(track_id, timestamp_ms);

-- MIXDOWNS Indexes
CREATE INDEX IF NOT EXISTS idx_mixdowns_project ON mixdowns(project_id);
CREATE INDEX IF NOT EXISTS idx_mixdowns_creator ON mixdowns(created_by);
CREATE INDEX IF NOT EXISTS idx_mixdowns_final ON mixdowns(is_final) WHERE is_final = true;

-- PRESETS Indexes
CREATE INDEX IF NOT EXISTS idx_presets_creator ON presets(created_by);
CREATE INDEX IF NOT EXISTS idx_presets_category ON presets(category);
CREATE INDEX IF NOT EXISTS idx_presets_tags ON presets USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_presets_public ON presets(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_presets_featured ON presets(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_presets_search ON presets USING GIN(search_vector);

-- TRACK_COMMENTS Indexes
CREATE INDEX IF NOT EXISTS idx_comments_track ON track_comments(track_id);
CREATE INDEX IF NOT EXISTS idx_comments_author ON track_comments(author_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON track_comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_comments_timestamp ON track_comments(track_id, timestamp_ms);

-- PROJECT_VERSIONS Indexes
CREATE INDEX IF NOT EXISTS idx_versions_project ON project_versions(project_id);
CREATE INDEX IF NOT EXISTS idx_versions_number ON project_versions(project_id, version_number DESC);

-- ============================================
-- VERIFICATION
-- ============================================
-- Run this to verify indexes:
-- SELECT tablename, indexname FROM pg_indexes WHERE schemaname = 'public' AND tablename LIKE '%project%' OR tablename LIKE '%track%' ORDER BY tablename;
