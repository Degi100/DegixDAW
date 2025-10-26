# Session Notes - 2025-10-25

## Was wir gemacht haben:

### ❌ Email Invitations (5h) - BLOCKED
- Problem: `inviteUserByEmail()` schlägt fehl mit "Database error saving new user"
- Root Cause: RLS Policy Konflikt (trigger kann Profile nicht erstellen)
- Status: Workaround dokumentiert in `EMAIL_INVITATION_ISSUE.md`
- Entscheidung: Feature skippen, normale User-Search funktioniert

### ✅ File Browser → Projects Feature (Planung)
- Branch: `feat/file-browser-to-projects`
- Ziel: Audio-Files aus Chat/File Browser zu Projects hinzufügen

**Erkenntnisse:**
- 3 Supabase Buckets: `message-attachments`, `project-tracks`, `shared_files`
- File Browser zeigt nur Chat-Messages (keine Direct Uploads!)
- Keine `message_attachments` Tabelle (nur `messages`)

**Offene Entscheidungen:**
1. Welchen Bucket für User Library? (`shared_files` empfohlen)
2. Neue Tabelle `user_files` erstellen?
3. Copy-on-Add vs. Shared Storage?

## Nächste Session:

**Option A: File Browser → Projects** (4-6h)
- [ ] Entscheidung: Storage-Architektur
- [ ] Database Migration (`user_files` + `tracks` erweitern)
- [ ] `AddToProjectButton` Component
- [ ] Service Functions

**Option B: Audio Recording Feature** (1-2h)
- [ ] `AudioRecorderModal` Component
- [ ] MediaRecorder API Integration
- [ ] Upload über existierenden Flow

## Commits heute:
- `1172ccf` - fix(projects): Connect email invitation system
- `55725a7` - docs: Document email invitation issue

## Branch Status:
- `main` - Clean
- `feat/fix-email-invitations` - Merged (Email-Fix Code)
- `feat/file-browser-to-projects` - Active (noch leer)
