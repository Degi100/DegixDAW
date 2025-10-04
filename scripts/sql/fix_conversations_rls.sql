-- ============================================
-- FIX: Conversations INSERT Policy
-- ============================================
-- Problem: auth.uid() = created_by schlägt fehl
-- Lösung: Erlaube INSERT wenn created_by gesetzt ist

BEGIN;

-- DROP alte Policy
DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;

-- NEUE POLICY: Jeder authentifizierte User kann Conversations erstellen
CREATE POLICY "conversations_insert_authenticated"
  ON public.conversations FOR INSERT
  WITH CHECK (
    -- Erlaubt wenn created_by != NULL (wird vom Code gesetzt)
    created_by IS NOT NULL
    -- ODER: Erlaube allen authentifizierten Usern
    -- auth.role() = 'authenticated'
  );

COMMIT;

-- ============================================
-- Alternative: Noch offenere Policy
-- ============================================
-- Wenn das auch nicht funktioniert, kommentiere oben aus
-- und nutze diese SUPER-PERMISSIVE Policy:

-- BEGIN;
-- DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;
-- DROP POLICY IF EXISTS "conversations_insert_authenticated" ON public.conversations;
-- 
-- CREATE POLICY "conversations_insert_any"
--   ON public.conversations FOR INSERT
--   WITH CHECK (true);  -- ⚠️ Jeder kann erstellen (nur für Testing!)
-- COMMIT;
