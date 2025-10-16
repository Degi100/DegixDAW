-- DEBUG: Storage Issues - Prüfe Daten und Config

-- 1. PRÜFE: Wie sehen die file_url Daten aus?
SELECT
  id,
  file_name,
  file_url,
  thumbnail_url,
  LENGTH(file_url) as url_length,
  CASE
    WHEN file_url LIKE 'http%' THEN 'FULL_URL'
    WHEN file_url LIKE '%/%' THEN 'PATH'
    ELSE 'UNKNOWN'
  END as url_type
FROM message_attachments
ORDER BY created_at DESC
LIMIT 5;

-- 2. PRÜFE: Bucket Configuration
SELECT
  name as bucket_name,
  public as is_public,
  file_size_limit / 1024 / 1024 as max_size_mb,
  allowed_mime_types
FROM storage.buckets
WHERE name = 'chat-attachments';

-- 3. PRÜFE: Storage Policies
SELECT
  policyname,
  cmd as operation,
  roles,
  CASE
    WHEN qual LIKE '%authenticated%' THEN 'AUTHENTICATED'
    WHEN qual = 'true' THEN 'PUBLIC'
    ELSE 'RESTRICTED'
  END as access_level
FROM pg_policies
WHERE schemaname = 'storage'
AND tablename = 'objects'
AND (policyname LIKE '%chat%' OR qual LIKE '%chat-attachments%')
ORDER BY cmd;

-- 4. TEST: Erstelle eine Signed URL (kopiere das Result und teste im Browser)
-- ACHTUNG: Ersetze 'YOUR_FILE_PATH' mit einem echten Pfad aus Query 1
-- Beispiel: '9187493e-3145-4b19-9b0d-e6e779c2d592/f85c40e9-3877-459e-a76c-3acd05e8d335/1760294689024.JPG'

/*
SELECT storage.create_signed_url(
  'chat-attachments',
  'YOUR_FILE_PATH_HERE',
  3600
) as signed_url;
*/

-- 5. ZEIGE: Alle Dateien im Bucket (via Storage API Simulation)
-- Das zeigt ob Dateien physisch existieren
SELECT
  name as file_path,
  bucket_id,
  metadata->>'size' as size_bytes,
  created_at
FROM storage.objects
WHERE bucket_id = 'chat-attachments'
ORDER BY created_at DESC
LIMIT 10;

-- ========================================
-- QUICK FIX wenn Bucket PUBLIC ist
-- ========================================

-- Falls der Bucket noch public ist, ändere ihn zu private:
-- UPDATE storage.buckets SET public = false WHERE name = 'chat-attachments';

-- Falls keine Policies existieren, erstelle sie:
-- (Ausführen wenn Query 3 keine Ergebnisse zeigt)

/*
-- Policy für SELECT (Download)
CREATE POLICY "Authenticated users can download files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'chat-attachments');

-- Policy für INSERT (Upload)
CREATE POLICY "Authenticated users can upload files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'chat-attachments');
*/
