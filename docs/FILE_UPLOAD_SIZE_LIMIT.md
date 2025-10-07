# File Upload Size Limit - Änderungen Zusammenfassung

## ✅ Was wurde geändert:

### 1. **Supabase Bucket Limit**
- **Datei**: `scripts/sql/create_storage_bucket.sql`
- **Änderung**: `file_size_limit` von 50 MB → **5 MB**
- **Wert**: `5242880` bytes (5 * 1024 * 1024)

### 2. **Frontend Validierung**
- **Datei**: `src/hooks/useMessageAttachments.ts`
- **NEU**: File-Size Validierung vor Upload
- **Limit**: 5 MB (5 * 1024 * 1024 bytes)
- **Fehler**: User-friendly Error Message mit aktueller & max Größe

### 3. **Zentrale Konfiguration**
- **Datei**: `src/lib/constants/storage.ts` ✨ NEU
- **Konstanten**:
  ```typescript
  MAX_FILE_SIZE = 5 * 1024 * 1024  // 5 MB
  MAX_FILE_SIZE_MB = 5             // für Display
  STORAGE_BUCKET = 'chat-attachments'
  ALLOWED_MIME_TYPES = [...]       // Alle erlaubten Typen
  ```

### 4. **UI Updates**
- **Datei**: `src/components/chat/ExpandedChat.tsx`
- **Tooltip**: "📎 Max 5 MB pro Datei"
- **Accept**: Erweitert um `.xls, .xlsx`

## 🎯 Synchronisation:

```
Supabase Bucket Limit (5 MB)
    ↕
Frontend Validation (5 MB)
    ↕
Constants File (5 MB)
    ↕
UI Tooltip (5 MB)
```

**Alle Werte sind jetzt synchron!** ✅

## 🔄 Wenn du das Limit ändern willst:

1. **Supabase SQL**: `scripts/sql/create_storage_bucket.sql` → `file_size_limit`
2. **Frontend Konstante**: `src/lib/constants/storage.ts` → `MAX_FILE_SIZE` & `MAX_FILE_SIZE_MB`
3. **UI Tooltip** (optional): `ExpandedChat.tsx` → `title` Attribut
4. **SQL ausführen**: Script neu ausführen mit `ON CONFLICT DO UPDATE`

## ✅ Testing:

1. Upload einer Datei < 5 MB → ✅ Sollte funktionieren
2. Upload einer Datei > 5 MB → ❌ Error: "Datei zu groß! X.XX MB (Max: 5 MB)"

## 📊 Unterstützte Dateitypen:

- 📷 **Bilder**: JPEG, PNG, GIF, WebP, SVG
- 🎥 **Videos**: MP4, WebM, QuickTime, AVI
- 🎵 **Audio**: MP3, WAV, OGG, WebM, MIDI
- 📄 **Dokumente**: PDF, DOC, DOCX, XLS, XLSX, TXT, CSV

Alle mit automatischer Thumbnail-Generierung wo möglich!
