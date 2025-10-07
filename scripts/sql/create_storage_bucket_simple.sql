-- ============================================
-- QUICK START: Storage Bucket ohne komplexe Policies
-- ============================================

-- 1. Bucket erstellen
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES (
  'chat-attachments',
  'chat-attachments',
  true, -- öffentlich
  52428800 -- 50MB
)
ON CONFLICT (id) DO NOTHING;

-- 2. Einfache Policy für Testing/Development
-- Erlaubt allen authentifizierten Usern Upload/View/Delete
-- ACHTUNG: Nur für Development! Für Production die komplexen Policies nutzen!

-- Diese Policies kannst du im Supabase Dashboard erstellen:
-- Storage -> chat-attachments -> Policies -> "New Policy"

-- Policy: "Allow authenticated users full access"
-- Operations: SELECT, INSERT, UPDATE, DELETE
-- Target roles: authenticated
-- Policy definition: bucket_id = 'chat-attachments'

-- ODER noch einfacher für lokales Testing:
-- Policy: "Allow all access" 
-- Operations: SELECT, INSERT, UPDATE, DELETE
-- Target roles: public, authenticated
-- Policy definition: true

-- ============================================
-- Verifikation
-- ============================================
-- SELECT * FROM storage.buckets WHERE id = 'chat-attachments';
