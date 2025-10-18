# Session Summary - File Upload Fix - 2025-10-18

## Kontext
Rebuild des File Browser Systems von `shared_files` auf `chat-attachments` basiertes System.

---

## Was wurde umgesetzt

### ✅ 1. FileBrowser Architektur komplett umgebaut
- **Alt**: `shared_files` Tabelle mit direkten user1_id/user2_id
- **Neu**: `chat-attachments` basierend auf `message_attachments` + `conversations` + `conversation_members`

**Dateien erstellt/geändert:**
- `web/frontend/src/hooks/useAllAttachments.ts` - Neuer Hook für FileBrowser
- `web/frontend/src/components/files/FileBrowser.tsx` - Komplett neu geschrieben
- `web/frontend/src/components/files/SendFileModal.tsx` - Komplett neu geschrieben

### ✅ 2. Conversation System korrigiert
**Problem**: Code nutzte `conversations.user1_id` und `conversations.user2_id` (existieren nicht!)

**Lösung**: Migration auf `conversation_members` Junction Table
- `SendFileModal.tsx`: `getOrCreateConversation()` nutzt jetzt `conversation_members`
- `useAllAttachments.ts`: Filtert über `conversation_members` statt direkte user IDs
- Self-Conversation Support: 1 Member = Self, 2 Members = Normal Conversation

### ✅ 3. FileBrowser Features
**4 Tabs implementiert:**
- 💬 **Alle**: Alle chat attachments
- 📥 **Empfangen**: `recipientId === userId AND senderId !== userId`
- 📤 **Gesendet**: `senderId === userId AND recipientId !== userId`
- 📁 **Meine Dateien**: `senderId === userId AND recipientId === userId` (Self-Conversation)

**Filter:**
- 🖼️ Bilder, 🎥 Videos, 🎵 Audio, 📄 Dokumente

### ✅ 4. Database Schema Fixes
**Migration 004_shared_files.sql angepasst:**
- Storage Policies umbenannt mit Prefix `shared_files:` um Konflikte zu vermeiden
- Alte conflicting Policies für `chat-attachments` gelöscht
- Neue Policies für `chat-attachments` erstellt:
  - `chat-attachments: users can upload`
  - `chat-attachments: users can view`
  - `chat-attachments: users can update`
  - `chat-attachments: users can delete`

### ✅ 5. Message Type Fix
- `messages` Tabelle hat Spalte `message_type` (NICHT `type`)
- `SendFileModal.tsx` korrigiert: `message_type: 'file'`

---

## ❌ KRITISCHES PROBLEM (UNGELÖST)

### File Upload schlägt fehl mit 415 Error

**Fehler:**
```
POST .../storage/v1/object/chat-attachments/... 400 (Bad Request)
StorageApiError: mime type application/json is not supported
Status Code: 415
```

**Was funktioniert:**
- ✅ FileBrowser zeigt existierende Dateien an (mit "Object not found" Warnings für alte Dateien)
- ✅ Text-Nachrichten im Chat funktionieren
- ✅ File Object ist korrekt (`isFile: true`, `fileType: 'image/jpeg'`, etc.)

**Was NICHT funktioniert:**
- ❌ File Upload im Chat
- ❌ File Upload im FileBrowser
- ❌ Datei-Vorschau (wegen fehlender neuer Uploads)

**Versuchte Lösungen:**
1. ❌ `contentType` Parameter explizit gesetzt → gleicher Fehler
2. ❌ `contentType` Parameter entfernt → gleicher Fehler
3. ❌ Storage Policies neu erstellt → gleicher Fehler
4. ❌ Bucket zwischen `chat-attachments` und `message-attachments` gewechselt → gleicher Fehler

**Debug Info:**
```javascript
🔍 Upload Debug: {
  fileName: 'c91b930d-.../1760795059007.jpg',
  fileType: 'image/jpeg',
  fileSize: 147266,
  isFile: true,
  isBlob: true,
  bucket: 'chat-attachments'
}

❌ Upload Error Details: {
  message: 'mime type application/json is not supported',
  statusCode: '415',
  name: 'StorageApiError'
}
```

**Vermutung:**
Der 415 Fehler deutet darauf hin, dass Supabase Storage den Request selbst ablehnt, BEVOR die Datei verarbeitet wird. Möglicherweise:
- Supabase SDK sendet falschen Content-Type Header
- Storage API erwartet anderen Request-Body Format
- CORS Problem
- Supabase Storage Bug

---

## Code-Änderungen im Detail

### 1. useAllAttachments.ts
```typescript
// Separate Queries statt nested joins
1. Fetch message_attachments
2. Fetch messages by message_ids
3. Fetch conversation_members für filtering
4. Fetch all conversation members für recipient logic
5. Fetch profiles
6. Generate signed URLs
7. Map zu AttachmentItem[]

// Recipient Logic
- Self-Conversation: convMembers.length === 1
- Normal: convMembers.find(uid => uid !== senderId)
```

### 2. SendFileModal.tsx
```typescript
// getOrCreateConversation() neu
1. Get my conversations via conversation_members
2. Filter type='direct'
3. For each: count members where userId IN [userId, otherUserId]
4. Self-conversation: expectedCount = 1
5. Normal: expectedCount = 2
6. If not found: create new conversation + add members
```

### 3. useMessageAttachments.ts
```typescript
// Upload-Code (BROKEN!)
const { data, error } = await supabase.storage
  .from('chat-attachments')
  .upload(fileName, file, {
    cacheControl: '3600',
    upsert: false
    // contentType entfernt - hilft nicht!
  });
```

---

## Konfiguration

### Storage Bucket: chat-attachments
```sql
-- Bucket Config (bereits vorhanden)
id: 'chat-attachments'
public: false
file_size_limit: 5242880 (5 MB)
allowed_mime_types: ['image/jpeg', 'image/png', ...]
```

### Storage Policies (neu erstellt)
```sql
-- INSERT Policy
CREATE POLICY "chat-attachments: users can upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'chat-attachments'
    AND auth.role() = 'authenticated'
  );

-- SELECT Policy
CREATE POLICY "chat-attachments: users can view"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'chat-attachments'
    AND auth.role() = 'authenticated'
  );
```

---

## Nächste Schritte (für neue Session)

### Priorität 1: 415 Upload Error fixen
**Ansätze:**
1. **Network Tab analysieren** - Browser DevTools → Headers & Body prüfen
2. **Supabase Dashboard Upload** - Direkt im Dashboard testen ob Upload grundsätzlich funktioniert
3. **Alternativer Upload-Ansatz** - FormData statt File Object
4. **Supabase SDK Version prüfen** - Evtl. Bug in aktueller Version
5. **Storage Bucket neu erstellen** - Evtl. korrupte Config
6. **XMLHttpRequest statt SDK** - Manueller Upload ohne SDK

### Priorität 2: Vergleich mit funktionierendem Code
- `useExpandedChat.ts` nutzt `message-attachments` Bucket
- Dort funktioniert Upload (oder?)
- Side-by-side Vergleich der Upload-Calls

### Priorität 3: Cleanup
- Debug Logging aus `useMessageAttachments.ts` entfernen
- Old files (`.old.tsx`) löschen
- Build durchführen

---

## Wichtige Code-Locations

### Upload Logic (BROKEN)
- `web/frontend/src/hooks/useMessageAttachments.ts:185-205` - Upload Code + Error Logging
- `web/frontend/src/components/files/SendFileModal.tsx:235` - Upload Trigger
- `web/frontend/src/lib/constants/storage.ts:57` - STORAGE_BUCKET = 'chat-attachments'

### Conversation Logic (WORKS)
- `web/frontend/src/components/files/SendFileModal.tsx:118-197` - getOrCreateConversation
- `web/frontend/src/hooks/useAllAttachments.ts:95-112` - Member Filtering

### Display Logic (WORKS)
- `web/frontend/src/hooks/useAllAttachments.ts:214-237` - Tab Filtering
- `web/frontend/src/components/files/FileBrowser.tsx` - UI

### Vergleich: useExpandedChat (evtl. funktionierend?)
- `web/frontend/src/hooks/useExpandedChat.ts:119-144` - handleFileUpload
- Nutzt `message-attachments` Bucket
- Simplerer Pfad: `${userId}/${timestamp}.${ext}`

---

## Geänderte Dateien

```
modified:   web/frontend/src/lib/constants/storage.ts
modified:   web/frontend/src/components/files/SendFileModal.tsx
modified:   web/frontend/src/components/files/FileBrowser.tsx
modified:   web/frontend/src/hooks/useMessageAttachments.ts
created:    web/frontend/src/hooks/useAllAttachments.ts
modified:   docs/architecture/migrations/004_shared_files.sql

created:    web/frontend/src/components/files/FileBrowser.old.tsx
created:    web/frontend/src/components/files/SendFileModal.old.tsx
```

---

## System Configuration

**Korrekte Architektur (vom User bestätigt):**
- **Bucket**: `chat-attachments` (NICHT `message-attachments`)
- **System**: Signed URLs (private, sicher)
- **Pfad**: `{conversationId}/{messageId}/{timestamp}.{ext}`
- **DB Tabellen**:
  - `message_attachments` - File metadata
  - `messages` - Chat messages
  - `conversations` - Conversation headers
  - `conversation_members` - Junction table (NOT user1_id/user2_id!)

**Alte Dateien (ignorieren):**
- Im falschen Bucket oder falschen Pfad gespeichert
- "Object not found" Fehler sind normal
- Nur neue Uploads sind relevant

---

## Zusammenfassung

**Erfolge:**
- ✅ FileBrowser komplett umgebaut auf chat-attachments System
- ✅ conversation_members Integration funktioniert
- ✅ Self-Conversation Logik implementiert
- ✅ 4 Tabs mit korrektem Filtering
- ✅ Database Schema sauber (keine Konflikte mehr)
- ✅ FileBrowser ZEIGT Dateien an

**Kritisches Problem:**
- ❌ **File Upload komplett broken** mit 415 Error
- Ursache unklar trotz vieler Versuche
- Sowohl Chat als auch FileBrowser Upload betroffen
- File Object ist korrekt, Problem liegt in Supabase Storage Call

**User's Statement:**
> "also wir uerlegen nohcmal neu... wenn ich eine textnachricht im chat verschicke, werden textnachtichten verschickt und angezeigt. veschicke ich eine datei geht es nicht. ich bekomme auch keine vorschau mehr angezeigt"

> "NEIN MAN!~ chat-attachments ist richtig, hier die dateien drinne und in shared files."

> "ok easy.. auf jeden fall 2 [System 2 mit Signed URLs]. wenn der chat wieder lauft gehts weiter"

**Empfehlung für neue Session:**
1. **Fokus NUR auf 415 Error** - alles andere funktioniert
2. **Network Tab genau analysieren** - Was wird wirklich gesendet?
3. **Supabase Dashboard Test** - Funktioniert Upload dort?
4. **Alternativer Ansatz** - Evtl. komplett anderen Upload-Weg

**Status:** User ist durcheinander, will neue Session mit frischem Fokus.
