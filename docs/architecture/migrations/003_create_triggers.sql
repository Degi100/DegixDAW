-- ============================================
-- MIGRATION 003: Create Triggers & Functions
-- SAFE: Only creates new triggers
-- ============================================

-- Updated_at Trigger Function (reusable)
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Full-text Search Trigger Function
CREATE OR REPLACE FUNCTION update_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  -- For projects table
  IF TG_TABLE_NAME = 'projects' THEN
    NEW.search_vector :=
      setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
      setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B');
  END IF;

  -- For presets table
  IF TG_TABLE_NAME = 'presets' THEN
    NEW.search_vector :=
      setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
      setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply Triggers to PROJECTS
DROP TRIGGER IF EXISTS projects_updated_at ON projects;
CREATE TRIGGER projects_updated_at
BEFORE UPDATE ON projects
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS projects_search_vector_update ON projects;
CREATE TRIGGER projects_search_vector_update
BEFORE INSERT OR UPDATE ON projects
FOR EACH ROW
EXECUTE FUNCTION update_search_vector();

-- Apply Triggers to TRACKS
DROP TRIGGER IF EXISTS tracks_updated_at ON tracks;
CREATE TRIGGER tracks_updated_at
BEFORE UPDATE ON tracks
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- Apply Triggers to PRESETS
DROP TRIGGER IF EXISTS presets_updated_at ON presets;
CREATE TRIGGER presets_updated_at
BEFORE UPDATE ON presets
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS presets_search_vector_update ON presets;
CREATE TRIGGER presets_search_vector_update
BEFORE INSERT OR UPDATE ON presets
FOR EACH ROW
EXECUTE FUNCTION update_search_vector();

-- Apply Triggers to TRACK_COMMENTS
DROP TRIGGER IF EXISTS track_comments_updated_at ON track_comments;
CREATE TRIGGER track_comments_updated_at
BEFORE UPDATE ON track_comments
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- ============================================
-- VERIFICATION
-- ============================================
-- Run this to verify triggers:
-- SELECT trigger_name, event_object_table FROM information_schema.triggers WHERE trigger_schema = 'public' AND event_object_table LIKE '%project%' OR event_object_table LIKE '%track%';
