# 🔄 Continue Tomorrow - Project Versioning Tasks

**Date:** 2025-10-29
**Branch:** `feat/project-versioning-and-collab-roles`
**Session:** Project Versioning & Collaborator Role Management

---

## ✅ **Completed Today**

### 1. Task #1: Collaborator Invitation Wizard ✅
- Added **Step 5: Upload Track (Optional)** to Project Create Wizard
- Shows invitation confirmation: "📧 Invitations sent to @userB (role)"
- User can upload first track or skip to project
- Fixed TypeScript errors (TrackUploadZone props, CreateProjectVersionRequest)

**Files Changed:**
- `components/projects/ProjectCreateModal.tsx`
- `hooks/useCollaborators.ts`
- `pages/projects/ProjectDetailPage.tsx`
- `pages/projects/TestVersions.tsx`

**Commit:** `feat(wizard): Add Step 5 (Track Upload) to Project Create Wizard`

---

### 2. Task #2: Version Badges in Tracks ✅
- Created `trackVersionUtils.ts` with version analysis functions
- Created `TrackVersionBadge` component (📦 v2 Added, ✏️ v4 Modified)
- Integrated badges into AudioPlayer track header
- Dark mode support

**Files Created:**
- `lib/services/projects/trackVersionUtils.ts`
- `components/tracks/TrackVersionBadge.tsx`
- `styles/components/tracks/_track-version-badge.scss`

**Files Modified:**
- `components/audio/AudioPlayer.tsx` (added versionInfo prop)
- `pages/projects/ProjectDetailPage.tsx` (compute version info)
- `styles/components/audio/_audio-player.scss` (track-name-row)
- `styles/main.scss` (import badge styles)

**Commit:** `feat(tracks): Add version badges to track display`

---

## 🔄 **TODO for Tomorrow**

### Task #3: Direct Download Button for Tracks
**Priority:** Medium
**Complexity:** Easy (~30 minutes)

**What to do:**
1. Add download button (⬇️) to AudioPlayer or TrackCard
2. Use Supabase Storage `createSignedUrl()` to get download link
3. Trigger browser download with filename: `{track_name}_v{version}.{extension}`
4. Handle error cases (file not found, storage error)

**Files to modify:**
- `components/audio/AudioPlayer.tsx` - Add download button in header
- `lib/services/storage/trackStorage.ts` - Add `downloadTrack()` function
- `styles/components/audio/_audio-player.scss` - Style download button

**Implementation:**
```typescript
// trackStorage.ts
export async function getTrackDownloadUrl(filePath: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from('tracks')
    .createSignedUrl(filePath, 3600); // 1 hour expiry

  if (error) throw error;
  return data.signedUrl;
}

// AudioPlayer.tsx
const handleDownload = async () => {
  const url = await getTrackDownloadUrl(track.file_path);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${track.name}.${getFileExtension(track.file_path)}`;
  a.click();
};
```

---

### Task #4: Comments in Version Snapshots
**Priority:** High
**Complexity:** Hard (~1-2 hours)

**What to do:**
1. Extend `ProjectVersionSnapshot` type to include `comments: TrackComment[]`
2. Modify `createProjectVersion()` to fetch and store all track comments
3. Modify `restoreProjectVersion()` to restore comments
4. **PROBLEM:** After restore, tracks get new IDs → Comments need to be re-mapped!

**Files to modify:**
- `types/projects.ts` - Extend `ProjectVersionSnapshot` interface
- `lib/services/projects/versionsService.ts` - Add comments to snapshot + restore
- `lib/services/tracks/commentsService.ts` - Fetch comments by project_id

**Implementation Strategy:**

```typescript
// types/projects.ts
export interface ProjectVersionSnapshot {
  project: Project;
  tracks: Track[];
  comments: TrackComment[]; // ✨ NEW
  settings: {
    bpm: number;
    time_signature: string;
    key?: string | null;
  };
  metadata?: Record<string, any>;
}

// versionsService.ts - createProjectVersion()
// 1. Get all comments for all tracks in project
const { data: comments } = await supabase
  .from('track_comments')
  .select('*')
  .in('track_id', tracks.map(t => t.id));

// 2. Add to snapshot
const snapshotData: ProjectVersionSnapshot = {
  project,
  tracks,
  comments: comments || [], // ✨ NEW
  settings: { bpm, time_signature, key },
  metadata,
};

// versionsService.ts - restoreProjectVersion()
// PROBLEM: After restore, tracks have NEW IDs!
// SOLUTION: Create mapping old_track_id → new_track_id

// 1. Restore tracks (get new IDs)
const { data: newTracks } = await supabase
  .from('tracks')
  .insert(tracksToInsert)
  .select();

// 2. Create mapping: old track_number → new track_id
const trackMapping = new Map();
newTracks.forEach((newTrack, index) => {
  const oldTrack = snapshot.tracks[index];
  trackMapping.set(oldTrack.id, newTrack.id);
});

// 3. Restore comments with NEW track_ids
if (snapshot.comments && snapshot.comments.length > 0) {
  const commentsToInsert = snapshot.comments.map(comment => ({
    ...comment,
    id: undefined, // Let DB generate new ID
    track_id: trackMapping.get(comment.track_id), // ✨ Map to new track ID
    created_at: new Date().toISOString(),
  }));

  await supabase.from('track_comments').insert(commentsToInsert);
}
```

**Edge Cases:**
- What if a comment's track_id doesn't exist in mapping? (Skip comment)
- What if tracks are reordered? (Use track_number for mapping, not array index)
- What if track was deleted in snapshot? (Comment is lost)

**Better Mapping Strategy:**
Use `track_number` instead of `track_id` for mapping (track_number is stable):

```typescript
// Map by track_number (more stable)
const trackMapping = new Map();
snapshot.tracks.forEach((oldTrack) => {
  const newTrack = newTracks.find(t => t.track_number === oldTrack.track_number);
  if (newTrack) {
    trackMapping.set(oldTrack.id, newTrack.id);
  }
});
```

---

## 📁 **Important Files**

### Modified Today:
- ✅ `components/projects/ProjectCreateModal.tsx`
- ✅ `components/audio/AudioPlayer.tsx`
- ✅ `pages/projects/ProjectDetailPage.tsx`
- ✅ `hooks/useCollaborators.ts`

### New Files Today:
- ✅ `lib/services/projects/trackVersionUtils.ts`
- ✅ `components/tracks/TrackVersionBadge.tsx`
- ✅ `styles/components/tracks/_track-version-badge.scss`

### To Modify Tomorrow:
- 🔄 `types/projects.ts` (add comments to snapshot)
- 🔄 `lib/services/projects/versionsService.ts` (comments logic)
- 🔄 `components/audio/AudioPlayer.tsx` (download button)
- 🔄 `lib/services/storage/trackStorage.ts` (download function)

### Realtime Migration (You marked this):
- 📄 `docs/architecture/migrations/015_enable_realtime_collaborators.sql`
  - Already executed (enables Realtime for collaborators table)
  - Used in `useCollaborators.ts` for live role updates

---

## 🌳 **Git Status**

**Current Branch:** `feat/project-versioning-and-collab-roles`

**Commits Today:**
1. `feat(projects): Add version control system + collaborator role management`
2. `feat(wizard): Add Step 5 (Track Upload) to Project Create Wizard`
3. `feat(tracks): Add version badges to track display`

**Ready to merge?** Not yet - wait for Tasks #3 & #4

---

## 🧪 **Testing Checklist for Tomorrow**

After implementing Tasks #3 & #4, test:

- [ ] Download button appears in AudioPlayer
- [ ] Download triggers browser save dialog
- [ ] Filename is correct: `Track Name.wav`
- [ ] Download works for all file types (WAV, MP3, FLAC)
- [ ] Error handling: File not found
- [ ] Create version with tracks that have comments
- [ ] Restore version → Comments are restored
- [ ] Restored comments point to correct tracks (new IDs)
- [ ] Comments without matching track are skipped (no errors)
- [ ] Version history shows comment count per version

---

## 💡 **Notes & Reminders**

- **Realtime Collaborators** is already working (Migration 015 executed)
- **Track Version Badges** compute on-the-fly from snapshots (no DB column needed)
- **Download Button** should be near track name or in transport controls
- **Comments Mapping** is the trickiest part - use `track_number` for stability

---

## 📊 **Progress**

| Task | Status | Time Spent |
|------|--------|------------|
| #1: Wizard Track Upload | ✅ Done | 1.5h |
| #2: Version Badges | ✅ Done | 1.5h |
| #3: Download Button | 🔄 TODO | ~0.5h |
| #4: Comments in Versions | 🔄 TODO | ~1.5h |

**Total Progress:** 50% (2/4 tasks done)

---

**Next Session Start:** Read this file + continue with Task #3! 🚀
