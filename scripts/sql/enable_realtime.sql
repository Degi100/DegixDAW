-- ============================================
-- ENABLE REALTIME für Social Connections
-- ============================================
-- Aktiviert Realtime Subscriptions für friendships und followers

-- 1. Aktiviere Realtime für friendships Tabelle
ALTER PUBLICATION supabase_realtime ADD TABLE public.friendships;

-- 2. Aktiviere Realtime für followers Tabelle
ALTER PUBLICATION supabase_realtime ADD TABLE public.followers;

-- 3. Verify: Zeige alle Tabellen mit Realtime
SELECT 
  schemaname,
  tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
ORDER BY tablename;

-- ============================================
-- Nach diesem Script:
-- - Friend Requests werden live aktualisiert
-- - Follower/Following Listen werden live aktualisiert
-- - Kein Browser-Refresh mehr nötig! 🎉
-- ============================================
