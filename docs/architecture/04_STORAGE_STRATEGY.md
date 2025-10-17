# Storage Strategy - DegixDAW

**Erstellt:** 2025-10-17
**Version:** 1.0

---

## 📦 Supabase Storage Buckets

### Bucket Overview

```
chat-attachments/          (EXISTING - Chat Files)
├── {user_id}/
│   └── {conversation_id}/
│       ├── image.jpg
│       ├── audio.mp3
│       └── document.pdf

music-projects/            (NEW - Music Files)
├── midi/
│   └── {project_id}/
│       ├── {track_id}_v1.mid
│       ├── {track_id}_v2.mid
│       └── {track_id}_final.mid
├── audio/
│   └── {project_id}/
│       ├── {track_id}_drums.wav
│       ├── {track_id}_bass.wav
│       └── {track_id}_vocals.wav
├── mixdowns/
│   └── {project_id}/
│       ├── {mixdown_id}_club_mix.wav
│       ├── {mixdown_id}_radio_edit.mp3
│       └── {mixdown_id}_instrumental.wav
└── presets/
    └── {user_id}/
        ├── {preset_id}_eq_chain.json
        ├── {preset_id}_compressor.json
        └── {preset_id}_reverb.json

project-thumbnails/        (NEW - Cover Art)
└── {project_id}/
    ├── cover_256.jpg      (Thumbnail)
    ├── cover_512.jpg      (Medium)
    └── cover_1024.jpg     (High-res)

user-samples/              (FUTURE - Sample Library)
└── {user_id}/
    └── samples/
        ├── kick_001.wav
        ├── snare_808.wav
        └── synth_pluck.wav
```

---

## 🔧 Bucket Configuration

### Create Buckets (SQL)

```sql
-- ============================================
-- CREATE STORAGE BUCKETS
-- ============================================

-- Music Projects Bucket (Private)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'music-projects',
  'music-projects',
  false, -- PRIVATE
  104857600, -- 100 MB per file
  ARRAY[
    'audio/midi',
    'audio/x-midi',
    'audio/wav',
    'audio/x-wav',
    'audio/mpeg',
    'audio/mp3',
    'audio/flac',
    'audio/aiff',
    'audio/x-aiff',
    'application/json'
  ]
);

-- Project Thumbnails Bucket (Public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'project-thumbnails',
  'project-thumbnails',
  true, -- PUBLIC (for easy display)
  5242880, -- 5 MB
  ARRAY[
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp'
  ]
);

-- User Samples Bucket (Private)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-samples',
  'user-samples',
  false,
  52428800, -- 50 MB per file
  ARRAY[
    'audio/wav',
    'audio/x-wav',
    'audio/mpeg',
    'audio/flac',
    'audio/aiff'
  ]
);
```

---

## 🔐 Storage Policies (RLS)

### MIDI Files Policies

```sql
-- ============================================
-- MIDI FILES POLICIES
-- ============================================

-- READ: Collaborators can read MIDI files
CREATE POLICY "collaborators_read_midi"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'music-projects' AND
  (storage.foldername(name))[1] = 'midi' AND
  (
    -- Project creator
    (storage.foldername(name))[2]::UUID IN (
      SELECT id::TEXT FROM projects WHERE creator_id = auth.uid()
    ) OR
    -- Collaborator
    (storage.foldername(name))[2]::UUID IN (
      SELECT project_id::TEXT FROM project_collaborators
      WHERE user_id = auth.uid() AND accepted_at IS NOT NULL
    )
  )
);

-- INSERT: Contributors can upload MIDI files
CREATE POLICY "contributors_upload_midi"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'music-projects' AND
  (storage.foldername(name))[1] = 'midi' AND
  (
    -- Project creator
    (storage.foldername(name))[2]::UUID IN (
      SELECT id::TEXT FROM projects WHERE creator_id = auth.uid()
    ) OR
    -- Can edit
    (storage.foldername(name))[2]::UUID IN (
      SELECT project_id::TEXT FROM project_collaborators
      WHERE user_id = auth.uid() AND can_edit = true
    )
  )
);

-- UPDATE: Only uploader can update
CREATE POLICY "owner_update_midi"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'music-projects' AND
  (storage.foldername(name))[1] = 'midi' AND
  owner = auth.uid()
);

-- DELETE: Only uploader can delete
CREATE POLICY "owner_delete_midi"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'music-projects' AND
  (storage.foldername(name))[1] = 'midi' AND
  owner = auth.uid()
);
```

### Audio Files Policies

```sql
-- ============================================
-- AUDIO FILES POLICIES
-- ============================================

-- READ: Collaborators can read audio files
CREATE POLICY "collaborators_read_audio"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'music-projects' AND
  (storage.foldername(name))[1] = 'audio' AND
  (
    (storage.foldername(name))[2]::UUID IN (
      SELECT id::TEXT FROM projects WHERE creator_id = auth.uid()
    ) OR
    (storage.foldername(name))[2]::UUID IN (
      SELECT project_id::TEXT FROM project_collaborators
      WHERE user_id = auth.uid() AND can_download = true
    )
  )
);

-- INSERT: Contributors can upload audio
CREATE POLICY "contributors_upload_audio"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'music-projects' AND
  (storage.foldername(name))[1] = 'audio' AND
  (
    (storage.foldername(name))[2]::UUID IN (
      SELECT id::TEXT FROM projects WHERE creator_id = auth.uid()
    ) OR
    (storage.foldername(name))[2]::UUID IN (
      SELECT project_id::TEXT FROM project_collaborators
      WHERE user_id = auth.uid() AND can_upload_audio = true
    )
  )
);

-- UPDATE/DELETE: Same as MIDI
CREATE POLICY "owner_update_audio"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'music-projects' AND
  (storage.foldername(name))[1] = 'audio' AND
  owner = auth.uid()
);

CREATE POLICY "owner_delete_audio"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'music-projects' AND
  (storage.foldername(name))[1] = 'audio' AND
  owner = auth.uid()
);
```

### Mixdowns Policies

```sql
-- ============================================
-- MIXDOWNS POLICIES
-- ============================================

-- READ: All collaborators can read mixdowns
CREATE POLICY "collaborators_read_mixdowns"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'music-projects' AND
  (storage.foldername(name))[1] = 'mixdowns' AND
  (
    (storage.foldername(name))[2]::UUID IN (
      SELECT id::TEXT FROM projects WHERE creator_id = auth.uid()
    ) OR
    (storage.foldername(name))[2]::UUID IN (
      SELECT project_id::TEXT FROM project_collaborators
      WHERE user_id = auth.uid() AND can_download = true
    )
  )
);

-- INSERT: Only mixers can upload mixdowns
CREATE POLICY "mixers_upload_mixdowns"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'music-projects' AND
  (storage.foldername(name))[1] = 'mixdowns' AND
  (
    (storage.foldername(name))[2]::UUID IN (
      SELECT id::TEXT FROM projects WHERE creator_id = auth.uid()
    ) OR
    (storage.foldername(name))[2]::UUID IN (
      SELECT project_id::TEXT FROM project_collaborators
      WHERE user_id = auth.uid() AND can_upload_mixdown = true
    )
  )
);

-- UPDATE/DELETE: Only uploader
CREATE POLICY "owner_update_mixdowns"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'music-projects' AND
  (storage.foldername(name))[1] = 'mixdowns' AND
  owner = auth.uid()
);

CREATE POLICY "owner_delete_mixdowns"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'music-projects' AND
  (storage.foldername(name))[1] = 'mixdowns' AND
  owner = auth.uid()
);
```

### Presets Policies

```sql
-- ============================================
-- PRESETS POLICIES
-- ============================================

-- READ: Public presets OR own presets
CREATE POLICY "users_read_presets"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'music-projects' AND
  (storage.foldername(name))[1] = 'presets' AND
  (
    -- Public presets
    (storage.foldername(name))[3]::UUID IN (
      SELECT id::TEXT FROM presets WHERE is_public = true
    ) OR
    -- Own presets
    (storage.foldername(name))[2]::UUID = auth.uid()::TEXT
  )
);

-- INSERT: Any authenticated user can create presets
CREATE POLICY "users_upload_presets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'music-projects' AND
  (storage.foldername(name))[1] = 'presets' AND
  (storage.foldername(name))[2]::UUID = auth.uid()::TEXT
);

-- UPDATE/DELETE: Only owner
CREATE POLICY "owner_update_presets"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'music-projects' AND
  (storage.foldername(name))[1] = 'presets' AND
  owner = auth.uid()
);

CREATE POLICY "owner_delete_presets"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'music-projects' AND
  (storage.foldername(name))[1] = 'presets' AND
  owner = auth.uid()
);
```

### Thumbnails Policies (Public Bucket)

```sql
-- ============================================
-- THUMBNAILS POLICIES (Public Bucket)
-- ============================================

-- READ: Public bucket, anyone can read
-- (No policy needed for public buckets)

-- INSERT: Only project creator
CREATE POLICY "creator_upload_thumbnail"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'project-thumbnails' AND
  (storage.foldername(name))[1]::UUID IN (
    SELECT id::TEXT FROM projects WHERE creator_id = auth.uid()
  )
);

-- UPDATE/DELETE: Only project creator
CREATE POLICY "creator_update_thumbnail"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'project-thumbnails' AND
  (storage.foldername(name))[1]::UUID IN (
    SELECT id::TEXT FROM projects WHERE creator_id = auth.uid()
  )
);

CREATE POLICY "creator_delete_thumbnail"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'project-thumbnails' AND
  (storage.foldername(name))[1]::UUID IN (
    SELECT id::TEXT FROM projects WHERE creator_id = auth.uid()
  )
);
```

---

## 🔗 Signed URLs

### Generate Signed URL (TypeScript)

```typescript
// Frontend: Generate signed URL for private files
import { supabase } from './supabase';

async function getSignedUrl(
  bucket: string,
  path: string,
  expiresIn: number = 3600 // 1 hour
): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);

  if (error) {
    console.error('Error generating signed URL:', error);
    return null;
  }

  return data.signedUrl;
}

// Example: Get signed URL for MIDI file
const midiUrl = await getSignedUrl(
  'music-projects',
  'midi/project-123/track-456.mid',
  3600
);

// Use in audio player
<audio src={midiUrl} controls />
```

### Generate Signed URL (C++ VST Plugin)

```cpp
// VST Plugin: HTTP request for signed URL
#include <curl/curl.h>
#include <nlohmann/json.hpp>

std::string SupabaseClient::getSignedUrl(
    const std::string& authToken,
    const std::string& bucket,
    const std::string& path
) {
    CURL* curl = curl_easy_init();
    if (!curl) return "";

    // Supabase Storage API endpoint
    std::string url = supabaseUrl + "/storage/v1/object/sign/" + bucket + "/" + path;

    // Request body
    nlohmann::json body = {
        {"expiresIn", 3600} // 1 hour
    };

    // Headers
    struct curl_slist* headers = NULL;
    headers = curl_slist_append(headers, ("Authorization: Bearer " + authToken).c_str());
    headers = curl_slist_append(headers, "Content-Type: application/json");

    // Response buffer
    std::string response;

    // Set options
    curl_easy_setopt(curl, CURLOPT_URL, url.c_str());
    curl_easy_setopt(curl, CURLOPT_POSTFIELDS, body.dump().c_str());
    curl_easy_setopt(curl, CURLOPT_HTTPHEADER, headers);
    curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, writeCallback);
    curl_easy_setopt(curl, CURLOPT_WRITEDATA, &response);

    // Perform request
    CURLcode res = curl_easy_perform(curl);

    // Cleanup
    curl_slist_free_all(headers);
    curl_easy_cleanup(curl);

    if (res != CURLE_OK) {
        return "";
    }

    // Parse response
    auto json = nlohmann::json::parse(response);
    return json["signedURL"].get<std::string>();
}
```

---

## 📤 File Upload Examples

### Upload MIDI File (Browser)

```typescript
// Frontend: Upload MIDI file to Supabase Storage
async function uploadMIDIFile(
  projectId: string,
  trackId: string,
  midiBlob: Blob
): Promise<string | null> {
  const fileName = `${trackId}_v${Date.now()}.mid`;
  const filePath = `midi/${projectId}/${fileName}`;

  const { data, error } = await supabase.storage
    .from('music-projects')
    .upload(filePath, midiBlob, {
      contentType: 'audio/midi',
      upsert: false, // Don't overwrite existing files
    });

  if (error) {
    console.error('Upload error:', error);
    return null;
  }

  return data.path;
}

// Usage with Tone.js
import * as Tone from 'tone';
import { Midi } from '@tonejs/midi';

// Create MIDI from notes
const midi = new Midi();
const track = midi.addTrack();
track.addNote({ midi: 60, time: 0, duration: 0.5 }); // C4
track.addNote({ midi: 64, time: 0.5, duration: 0.5 }); // E4

// Convert to Blob
const midiBlob = new Blob([midi.toArray()], { type: 'audio/midi' });

// Upload
const path = await uploadMIDIFile('project-123', 'track-456', midiBlob);
```

### Upload Audio File (VST Plugin)

```cpp
// VST Plugin: Upload mixdown WAV file
bool SupabaseClient::uploadFile(
    const std::string& authToken,
    const std::string& bucket,
    const std::string& path,
    const juce::File& file
) {
    CURL* curl = curl_easy_init();
    if (!curl) return false;

    // Read file bytes
    juce::FileInputStream stream(file);
    if (!stream.openedOk()) return false;

    std::vector<char> fileData((size_t)file.getSize());
    stream.read(fileData.data(), fileData.size());

    // Supabase Storage API endpoint
    std::string url = supabaseUrl + "/storage/v1/object/" + bucket + "/" + path;

    // Headers
    struct curl_slist* headers = NULL;
    headers = curl_slist_append(headers, ("Authorization: Bearer " + authToken).c_str());
    headers = curl_slist_append(headers, "Content-Type: audio/wav");

    // Set options
    curl_easy_setopt(curl, CURLOPT_URL, url.c_str());
    curl_easy_setopt(curl, CURLOPT_POST, 1L);
    curl_easy_setopt(curl, CURLOPT_POSTFIELDS, fileData.data());
    curl_easy_setopt(curl, CURLOPT_POSTFIELDSIZE, fileData.size());
    curl_easy_setopt(curl, CURLOPT_HTTPHEADER, headers);

    // Perform request
    CURLcode res = curl_easy_perform(curl);

    // Cleanup
    curl_slist_free_all(headers);
    curl_easy_cleanup(curl);

    return res == CURLE_OK;
}
```

---

## 📥 File Download Examples

### Download MIDI File (VST Plugin)

```cpp
// VST Plugin: Download MIDI file to temp folder
juce::File SupabaseClient::downloadFile(
    const std::string& signedUrl
) {
    CURL* curl = curl_easy_init();
    if (!curl) return juce::File();

    // Create temp file
    juce::File tempDir = juce::File::getSpecialLocation(juce::File::tempDirectory);
    juce::File tempFile = tempDir.getChildFile("degixdaw_" + juce::Uuid().toString() + ".mid");

    // Open file for writing
    juce::FileOutputStream stream(tempFile);
    if (!stream.openedOk()) return juce::File();

    // Download callback
    auto writeCallback = [](char* ptr, size_t size, size_t nmemb, void* userdata) -> size_t {
        auto* stream = static_cast<juce::FileOutputStream*>(userdata);
        stream->write(ptr, size * nmemb);
        return size * nmemb;
    };

    // Set options
    curl_easy_setopt(curl, CURLOPT_URL, signedUrl.c_str());
    curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, +writeCallback);
    curl_easy_setopt(curl, CURLOPT_WRITEDATA, &stream);
    curl_easy_setopt(curl, CURLOPT_FOLLOWLOCATION, 1L); // Follow redirects

    // Perform request
    CURLcode res = curl_easy_perform(curl);
    curl_easy_cleanup(curl);

    stream.flush();

    if (res != CURLE_OK) {
        tempFile.deleteFile();
        return juce::File();
    }

    return tempFile;
}
```

---

## 🗑️ File Cleanup

### Delete Old Versions (SQL Function)

```sql
-- ============================================
-- CLEANUP: Delete old MIDI versions
-- ============================================
CREATE OR REPLACE FUNCTION cleanup_old_midi_versions()
RETURNS void AS $$
BEGIN
  -- Keep only latest 5 versions per track
  DELETE FROM storage.objects
  WHERE bucket_id = 'music-projects'
    AND (foldername(name))[1] = 'midi'
    AND id NOT IN (
      SELECT id FROM storage.objects
      WHERE bucket_id = 'music-projects'
        AND (foldername(name))[1] = 'midi'
      ORDER BY created_at DESC
      LIMIT 5
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule cleanup (via pg_cron or Edge Function)
-- Run daily at 2 AM
SELECT cron.schedule(
  'cleanup-old-midi-versions',
  '0 2 * * *', -- Cron syntax: Every day at 2 AM
  'SELECT cleanup_old_midi_versions();'
);
```

### Delete Project Files on Project Delete

```sql
-- ============================================
-- TRIGGER: Delete storage files when project deleted
-- ============================================
CREATE OR REPLACE FUNCTION delete_project_files()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete MIDI files
  DELETE FROM storage.objects
  WHERE bucket_id = 'music-projects'
    AND (foldername(name))[1] = 'midi'
    AND (foldername(name))[2] = OLD.id::TEXT;

  -- Delete audio files
  DELETE FROM storage.objects
  WHERE bucket_id = 'music-projects'
    AND (foldername(name))[1] = 'audio'
    AND (foldername(name))[2] = OLD.id::TEXT;

  -- Delete mixdowns
  DELETE FROM storage.objects
  WHERE bucket_id = 'music-projects'
    AND (foldername(name))[1] = 'mixdowns'
    AND (foldername(name))[2] = OLD.id::TEXT;

  -- Delete thumbnails
  DELETE FROM storage.objects
  WHERE bucket_id = 'project-thumbnails'
    AND (foldername(name))[1] = OLD.id::TEXT;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_project_delete
AFTER DELETE ON projects
FOR EACH ROW
EXECUTE FUNCTION delete_project_files();
```

---

## 📊 Storage Analytics

### Get Storage Usage per User

```sql
-- ============================================
-- ANALYTICS: Storage usage per user
-- ============================================
CREATE OR REPLACE FUNCTION get_user_storage_usage(user_uuid UUID)
RETURNS TABLE (
  bucket_name TEXT,
  file_count BIGINT,
  total_bytes BIGINT,
  total_mb NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    bucket_id AS bucket_name,
    COUNT(*) AS file_count,
    SUM(COALESCE((metadata->>'size')::BIGINT, 0)) AS total_bytes,
    ROUND(SUM(COALESCE((metadata->>'size')::BIGINT, 0)) / 1024.0 / 1024.0, 2) AS total_mb
  FROM storage.objects
  WHERE owner = user_uuid
  GROUP BY bucket_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Usage:
-- SELECT * FROM get_user_storage_usage('user-uuid-here');
```

### Get Project Storage Usage

```sql
-- ============================================
-- ANALYTICS: Storage usage per project
-- ============================================
CREATE OR REPLACE FUNCTION get_project_storage_usage(project_uuid UUID)
RETURNS TABLE (
  file_type TEXT,
  file_count BIGINT,
  total_mb NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (foldername(name))[1] AS file_type,
    COUNT(*) AS file_count,
    ROUND(SUM(COALESCE((metadata->>'size')::BIGINT, 0)) / 1024.0 / 1024.0, 2) AS total_mb
  FROM storage.objects
  WHERE bucket_id = 'music-projects'
    AND (foldername(name))[2] = project_uuid::TEXT
  GROUP BY (foldername(name))[1];
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 🎯 Best Practices

### File Naming Convention

```
GOOD:
✅ midi/proj-123/track-456_v1.mid
✅ audio/proj-123/drums_final.wav
✅ mixdowns/proj-123/club_mix_2024-01-15.wav

BAD:
❌ midi/My Cool Track.mid              (No project ID, spaces)
❌ audio/proj-123/../../etc/passwd     (Path traversal attempt)
❌ mixdowns/proj-123/file with emoji 🎵.wav (Emojis in filenames)
```

### Validate Before Upload (Frontend)

```typescript
// Validate file before upload
function validateAudioFile(file: File): { valid: boolean; error?: string } {
  // Check file size (max 100 MB)
  if (file.size > 100 * 1024 * 1024) {
    return { valid: false, error: 'File too large (max 100 MB)' };
  }

  // Check MIME type
  const allowedTypes = ['audio/wav', 'audio/mpeg', 'audio/midi', 'audio/x-midi'];
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Invalid file type' };
  }

  // Check file extension
  const ext = file.name.split('.').pop()?.toLowerCase();
  const allowedExts = ['wav', 'mp3', 'mid', 'midi'];
  if (!ext || !allowedExts.includes(ext)) {
    return { valid: false, error: 'Invalid file extension' };
  }

  return { valid: true };
}
```

### Progress Tracking (Upload)

```typescript
// Track upload progress
async function uploadWithProgress(
  bucket: string,
  path: string,
  file: File,
  onProgress: (progress: number) => void
): Promise<string | null> {
  // Supabase JS Client doesn't support progress yet
  // Use fetch with manual upload

  const { data: session } = await supabase.auth.getSession();
  if (!session) return null;

  const url = `${SUPABASE_URL}/storage/v1/object/${bucket}/${path}`;

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const progress = (e.loaded / e.total) * 100;
        onProgress(progress);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        resolve(path);
      } else {
        reject(new Error(`Upload failed: ${xhr.statusText}`));
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Upload failed'));
    });

    xhr.open('POST', url);
    xhr.setRequestHeader('Authorization', `Bearer ${session.access_token}`);
    xhr.setRequestHeader('Content-Type', file.type);
    xhr.send(file);
  });
}
```

---

## 🚀 Migration Steps

### 1. Create Buckets

```bash
# Via Supabase Dashboard:
# Storage → New Bucket → "music-projects" → Private

# Or via SQL (see above)
```

### 2. Apply RLS Policies

```bash
# Run all policy SQL scripts in Supabase SQL Editor
```

### 3. Test Permissions

```typescript
// Test upload/download with different users
const testStoragePermissions = async () => {
  // As project creator
  await uploadMIDIFile(projectId, trackId, midiBlob); // Should work

  // As collaborator (can_edit=false)
  await uploadMIDIFile(projectId, trackId, midiBlob); // Should fail

  // As collaborator (can_download=true)
  const url = await getSignedUrl('music-projects', path); // Should work
};
```

---

**See also:**
- [02_DATABASE_SCHEMA.md](02_DATABASE_SCHEMA.md) - Database tables
- [03_DATA_FLOW.md](03_DATA_FLOW.md) - File upload/download flows
- [05_VST_PLUGIN.md](05_VST_PLUGIN.md) - VST file operations
