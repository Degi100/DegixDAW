-- ============================================
-- FIX: Feature Flags Permissions Error
-- Problem: Foreign Key zu auth.users + RLS Policy verursacht "permission denied"
-- Lösung: Entferne Foreign Keys, vereinfache RLS Policy
-- ============================================

-- 1. Drop Foreign Key Constraints
ALTER TABLE public.feature_flags
  DROP CONSTRAINT IF EXISTS feature_flags_created_by_fkey;

ALTER TABLE public.feature_flags
  DROP CONSTRAINT IF EXISTS feature_flags_updated_by_fkey;

-- 2. Make audit columns nullable and remove defaults
-- created_by und updated_by bleiben als UUID Felder, aber ohne FK zu auth.users
ALTER TABLE public.feature_flags
  ALTER COLUMN created_by DROP NOT NULL,
  ALTER COLUMN updated_by DROP NOT NULL;

-- Set existing NULL values if needed
UPDATE public.feature_flags
SET created_by = NULL, updated_by = NULL
WHERE created_by IS NOT NULL OR updated_by IS NOT NULL;

-- 3. Vereinfachte RLS Policy für Admins
DROP POLICY IF EXISTS "Only admins can modify feature flags" ON public.feature_flags;

-- Neue Policy: Nutze auth.jwt() um user_metadata zu lesen (kein auth.users Access nötig!)
CREATE POLICY "Only admins can modify feature flags"
  ON public.feature_flags
  FOR ALL
  USING (
    -- Check if user has is_admin = true in user_metadata
    (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true
  )
  WITH CHECK (
    -- Check if user has is_admin = true in user_metadata
    (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true
  );

-- 4. Grant permissions (falls noch nicht gesetzt)
GRANT SELECT ON public.feature_flags TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.feature_flags TO authenticated;

-- ============================================
-- READY!
-- ============================================
-- Jetzt sollte updateFeatureRoles funktionieren ohne "permission denied for table users"
