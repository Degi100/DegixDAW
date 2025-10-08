# Storage Bucket Setup für Chat-Attachments

## Problem
```
StorageApiError: Bucket not found
```

Der Storage Bucket `chat-attachments` existiert noch nicht in Supabase.

## Lösung

### Option 1: SQL Script ausführen (empfohlen)

1. **Öffne Supabase Dashboard** → SQL Editor
2. **Führe das Script aus**: `scripts/sql/create_storage_bucket.sql`

```bash
# Oder mit dem SQL-Executor Tool:
npm run db:run scripts/sql/create_storage_bucket.sql
```

### Option 2: Manuell im Supabase Dashboard

1. **Gehe zu Storage** → "New bucket"
2. **Name**: `chat-attachments`
3. **Public bucket**: ✅ Ja (für öffentliche URLs)
4. **File size limit**: 50 MB
5. **Allowed MIME types**: 
   - `image/*`
   - `video/*`
   - `audio/*`
   - `application/pdf`
   - `application/msword`
   - `application/vnd.openxmlformats-officedocument.wordprocessingml.document`

6. **RLS Policies erstellen**:
   - Users can upload to their conversations
   - Users can view attachments from their conversations
   - Users can delete their own attachments

## Features nach Setup

✅ **Upload-Funktionen**:
- 📷 Bilder (JPEG, PNG, GIF, WebP)
- 🎥 Videos (MP4, WebM, QuickTime)
- 🎵 Audio (MP3, WAV, OGG, MIDI)
- 📄 Dokumente (PDF, DOC, DOCX, TXT)

✅ **Sicherheit**:
- Row Level Security (RLS) aktiviert
- Nur Mitglieder der Conversation können hochladen/ansehen
- User können nur eigene Dateien löschen

✅ **Performance**:
- 50 MB Dateigrößen-Limit
- Automatische Thumbnail-Generierung für Bilder
- Public URLs für schnellen Zugriff

## Verifikation

Nach dem Setup kannst du testen:

```javascript
// Im Browser Console
const { data, error } = await supabase.storage
  .from('chat-attachments')
  .list();

console.log('Bucket exists:', !error);
```

## Troubleshooting

### Bucket existiert, aber Upload schlägt fehl
→ Überprüfe RLS Policies in Supabase Dashboard → Storage → Policies

### "Permission denied" Error
→ User muss Mitglied der Conversation sein (`conversation_members` Tabelle)

### Dateityp wird abgelehnt
→ Erweitere `allowed_mime_types` im Bucket oder entferne die Einschränkung
