-- ============================================
-- FEATURE FLAGS SYSTEM - DATABASE SETUP
-- Admin-controlled feature toggles with role-based access
-- Version: 1.0.0
-- ============================================

-- ============================================
-- 1. FEATURE FLAGS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.feature_flags (
  -- Identity
  id TEXT PRIMARY KEY,                              -- Feature ID (z.B. 'file_browser')
  name TEXT NOT NULL,                               -- Display Name (z.B. 'Datei-Browser')
  description TEXT NOT NULL,                        -- Beschreibung des Features

  -- State
  enabled BOOLEAN NOT NULL DEFAULT false,           -- Feature aktiv?

  -- Role-Based Access (JSONB für Flexibilität)
  allowed_roles JSONB NOT NULL DEFAULT '["admin"]', -- Array von Rollen: ["public", "user", "moderator", "admin"]

  -- Metadata
  version TEXT NOT NULL DEFAULT '1.0.0',            -- Seit welcher Version verfügbar
  category TEXT DEFAULT 'general',                  -- Kategorie (z.B. 'chat', 'files', 'admin')

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Constraints
  CONSTRAINT valid_roles CHECK (
    jsonb_typeof(allowed_roles) = 'array'
  )
);

-- ============================================
-- 2. INDEXES
-- ============================================

-- Fast lookup by ID (Primary Key schon indexed)
-- Fast lookup by enabled status
CREATE INDEX IF NOT EXISTS idx_feature_flags_enabled
  ON public.feature_flags(enabled);

-- Fast lookup by category
CREATE INDEX IF NOT EXISTS idx_feature_flags_category
  ON public.feature_flags(category);

-- Full-text search on name and description
CREATE INDEX IF NOT EXISTS idx_feature_flags_search
  ON public.feature_flags USING gin(to_tsvector('german', name || ' ' || description));

-- ============================================
-- 3. UPDATED_AT TRIGGER
-- ============================================

-- Automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_feature_flags_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_feature_flags_updated_at ON public.feature_flags;
CREATE TRIGGER trigger_update_feature_flags_updated_at
  BEFORE UPDATE ON public.feature_flags
  FOR EACH ROW
  EXECUTE FUNCTION public.update_feature_flags_updated_at();

-- ============================================
-- 4. ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

-- Policy: Jeder kann Feature-Flags LESEN (für canAccessFeature-Checks)
DROP POLICY IF EXISTS "Anyone can read feature flags" ON public.feature_flags;
CREATE POLICY "Anyone can read feature flags"
  ON public.feature_flags
  FOR SELECT
  USING (true);

-- Policy: Nur Admins können Feature-Flags ÄNDERN
DROP POLICY IF EXISTS "Only admins can modify feature flags" ON public.feature_flags;
CREATE POLICY "Only admins can modify feature flags"
  ON public.feature_flags
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (
        auth.users.raw_user_meta_data->>'is_admin' = 'true'
        OR auth.users.email = current_setting('app.super_admin_email', true)
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (
        auth.users.raw_user_meta_data->>'is_admin' = 'true'
        OR auth.users.email = current_setting('app.super_admin_email', true)
      )
    )
  );

-- ============================================
-- 5. HELPER FUNCTIONS
-- ============================================

-- Function: Check if user has access to a feature
CREATE OR REPLACE FUNCTION public.can_access_feature(
  p_feature_id TEXT,
  p_user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN AS $$
DECLARE
  v_feature RECORD;
  v_user_role TEXT;
  v_is_admin BOOLEAN;
BEGIN
  -- Get feature
  SELECT * INTO v_feature
  FROM public.feature_flags
  WHERE id = p_feature_id;

  -- Feature not found or disabled
  IF NOT FOUND OR NOT v_feature.enabled THEN
    RETURN false;
  END IF;

  -- No user (public access)
  IF p_user_id IS NULL THEN
    RETURN v_feature.allowed_roles ? 'public';
  END IF;

  -- Check if user is admin
  SELECT
    COALESCE(raw_user_meta_data->>'is_admin', 'false')::boolean
    OR email = current_setting('app.super_admin_email', true)
  INTO v_is_admin
  FROM auth.users
  WHERE id = p_user_id;

  -- Admins have access to everything
  IF v_is_admin THEN
    RETURN true;
  END IF;

  -- Check user role
  SELECT
    CASE
      WHEN raw_user_meta_data->>'is_admin' = 'true' THEN 'admin'
      WHEN raw_user_meta_data->>'is_moderator' = 'true' THEN 'moderator'
      ELSE 'user'
    END
  INTO v_user_role
  FROM auth.users
  WHERE id = p_user_id;

  -- Check if user's role is in allowed_roles
  RETURN v_feature.allowed_roles ? v_user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 6. SEED DEFAULT FEATURES
-- ============================================

-- Insert default features (idempotent with ON CONFLICT)
INSERT INTO public.feature_flags (id, name, description, enabled, allowed_roles, version, category, created_by)
VALUES
  -- Chat & Social
  (
    'chat_sidebar_polish',
    'Chat-Sidebar Verbesserungen',
    'Badge-Animationen, Glow-Effekte, optimistisches UI',
    true,
    '["public", "user", "moderator", "admin"]',
    '2.1.0',
    'chat',
    NULL
  ),
  (
    'social_features',
    'Social-Funktionen',
    'Freundesliste, Benutzer-Suche und Interaktionen',
    true,
    '["user", "moderator", "admin"]',
    '2.3.0',
    'social',
    NULL
  ),

  -- Files
  (
    'file_upload_system',
    'Datei-Upload System',
    'Upload von Bildern, Videos, Audio in Chats (5MB)',
    true,
    '["user", "moderator", "admin"]',
    '2.1.0',
    'files',
    NULL
  ),
  (
    'file_browser',
    'Datei-Browser',
    'Übersicht aller hochgeladenen Dateien mit Filter & Sortierung',
    true,
    '["admin"]',
    '2.2.0',
    'files',
    NULL
  ),

  -- Cloud
  (
    'cloud_integration',
    'Cloud-Integration',
    'Dropbox, Google Drive, OneDrive Integration',
    false,
    '["admin"]',
    '2.3.0',
    'cloud',
    NULL
  ),

  -- Core
  (
    'dashboard',
    'Dashboard',
    'Haupt-Dashboard mit Statistiken und schnellem Zugriff',
    true,
    '["user", "moderator", "admin"]',
    '2.3.0',
    'core',
    NULL
  ),
  (
    'chat_sidebar',
    'Chat-Seitenleiste',
    'Komplette Seitenleiste für Konversationen und Kontakte',
    true,
    '["user", "moderator", "admin"]',
    '2.3.0',
    'chat',
    NULL
  )
ON CONFLICT (id) DO UPDATE SET
  -- Update existing features (but keep enabled/allowed_roles as is)
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  version = EXCLUDED.version,
  category = EXCLUDED.category,
  updated_at = NOW();

-- ============================================
-- 7. REALTIME PUBLICATION
-- ============================================

-- Enable Realtime for feature_flags table
ALTER PUBLICATION supabase_realtime ADD TABLE public.feature_flags;

-- ============================================
-- 8. COMMENTS (Documentation)
-- ============================================

COMMENT ON TABLE public.feature_flags IS 'Feature toggles with role-based access control';
COMMENT ON COLUMN public.feature_flags.id IS 'Unique feature identifier (e.g. file_browser)';
COMMENT ON COLUMN public.feature_flags.allowed_roles IS 'JSON array of allowed roles: public, user, moderator, admin';
COMMENT ON COLUMN public.feature_flags.enabled IS 'Whether the feature is enabled globally';
COMMENT ON COLUMN public.feature_flags.category IS 'Feature category for grouping (chat, files, admin, etc.)';

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ Feature Flags System erfolgreich eingerichtet!';
  RAISE NOTICE '📊 Tabelle: public.feature_flags';
  RAISE NOTICE '🔒 RLS aktiviert (Admins = Write, Alle = Read)';
  RAISE NOTICE '🚀 Realtime aktiviert';
  RAISE NOTICE '📦 % Default-Features eingefügt', (SELECT COUNT(*) FROM public.feature_flags);
END $$;
