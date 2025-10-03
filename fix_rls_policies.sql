-- Fix RLS Policies für Issues Table
-- Diese Policies funktionieren sowohl im SQL Editor als auch über REST API

-- 1. Alte Policies löschen
DROP POLICY IF EXISTS "Admins can view all issues" ON public.issues;
DROP POLICY IF EXISTS "Admins can create issues" ON public.issues;
DROP POLICY IF EXISTS "Admins can update issues" ON public.issues;
DROP POLICY IF EXISTS "Admins can delete issues" ON public.issues;

-- 2. Neue Policies erstellen (mit auth.uid() statt auth.jwt())
-- Diese prüfen direkt in auth.users, nicht im JWT

-- Policy: Admins können Issues sehen
CREATE POLICY "Admins can view all issues"
ON public.issues
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND (
      (auth.users.raw_user_meta_data->>'is_admin')::boolean = true
      OR auth.users.email = 'rene.degering2014@gmail.com'
    )
  )
);

-- Policy: Admins können Issues erstellen
CREATE POLICY "Admins can create issues"
ON public.issues
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND (
      (auth.users.raw_user_meta_data->>'is_admin')::boolean = true
      OR auth.users.email = 'rene.degering2014@gmail.com'
    )
  )
);

-- Policy: Admins können Issues updaten
CREATE POLICY "Admins can update issues"
ON public.issues
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND (
      (auth.users.raw_user_meta_data->>'is_admin')::boolean = true
      OR auth.users.email = 'rene.degering2014@gmail.com'
    )
  )
);

-- Policy: Admins können Issues löschen
CREATE POLICY "Admins can delete issues"
ON public.issues
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND (
      (auth.users.raw_user_meta_data->>'is_admin')::boolean = true
      OR auth.users.email = 'rene.degering2014@gmail.com'
    )
  )
);

-- 3. Verify
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'issues';
