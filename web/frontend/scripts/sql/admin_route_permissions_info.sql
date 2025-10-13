-- ============================================================================
-- ADMIN ROUTE PERMISSIONS - INFO
-- ============================================================================
-- Granulare Route-Permissions für Admin/Moderator-User
--
-- WICHTIG: Route-Permissions werden in user_metadata gespeichert, NICHT in
--          der profiles Tabelle. Daher ist KEINE Migration nötig!
--
-- Struktur:
--   auth.users.user_metadata.allowed_admin_routes = ['issues', 'users', ...]
--
-- Flow:
--   1. Super-Admin öffnet /admin/users
--   2. Klickt "Edit" bei einem Admin/Moderator
--   3. Wählt erlaubte Routen via Checkboxen
--   4. Speichert → user_metadata.allowed_admin_routes wird aktualisiert
--   5. User kann nur noch gewählte Routen öffnen
--
-- Super-Admin Bypass:
--   Super-Admin (via VITE_SUPER_ADMIN_EMAIL) hat IMMER Zugriff auf alle Routen
-- ============================================================================

-- Beispiel: User mit Route-Permissions anzeigen
SELECT
  id,
  email,
  raw_user_meta_data->>'allowed_admin_routes' as allowed_routes,
  raw_user_meta_data->>'is_admin' as is_admin,
  raw_user_meta_data->>'is_moderator' as is_moderator
FROM auth.users
WHERE raw_user_meta_data->>'is_admin' = 'true'
   OR raw_user_meta_data->>'is_moderator' = 'true'
ORDER BY email;

-- Beispiel: Manuelle Route-Permission setzen (falls nötig)
-- UPDATE auth.users
-- SET raw_user_meta_data = jsonb_set(
--   raw_user_meta_data,
--   '{allowed_admin_routes}',
--   '["issues", "users"]'::jsonb
-- )
-- WHERE email = 'rdegi@example.com';
