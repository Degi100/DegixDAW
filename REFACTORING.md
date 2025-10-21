# 🔨 Refactoring Checkliste

**Erstellt:** 2025-10-21
**Ziel:** Code Quality auf 100% bringen (Max 400 LOC pro File)

---

## 🚨 Kritische Monoliths (>600 LOC)

### ❌ FileBrowser.tsx (688 LOC)
- **Path:** `web/frontend/src/components/files/FileBrowser.tsx`
- **Problem:** Monolith mit zu viel Logik
- **Split in:**
  - [ ] `FileBrowserList.tsx` (UI Component)
  - [ ] `FileBrowserHeader.tsx` (Toolbar/Actions)
  - [ ] `FileBrowserItem.tsx` (Single File Entry)
  - [ ] `useFileBrowser.ts` (Data Hook)
  - [ ] `useFileActions.ts` (Upload/Delete/Download)
  - [ ] `fileUtils.ts` (Helper Functions)
- **Priorität:** 🔴 CRITICAL

---

### ❌ CodeGrowthChart.tsx (641 LOC)
- **Path:** `web/frontend/src/components/admin/analytics/CodeGrowthChart.tsx`
- **Problem:** Chart-Komponente zu groß
- **Split in:**
  - [ ] `CodeGrowthChart.tsx` (Main Component)
  - [ ] `ChartMetricsSelector.tsx` (Metric Toggles)
  - [ ] `ChartTooltip.tsx` (Custom Tooltip)
  - [ ] `useChartData.ts` (Data Preparation Hook)
  - [ ] `chartConfig.ts` (Metrics Config Array)
- **Priorität:** 🔴 CRITICAL

---

### ❌ useConversations.ts (604 LOC)
- **Path:** `web/frontend/src/hooks/useConversations.ts`
- **Problem:** Hook-Monolith mit zu viel State
- **Split in:**
  - [ ] `useConversations.ts` (Main Hook - nur Query)
  - [ ] `useConversationActions.ts` (Create/Delete/Update)
  - [ ] `useConversationSearch.ts` (Search/Filter Logic)
  - [ ] `conversationsService.ts` (API Calls)
- **Priorität:** 🔴 CRITICAL

---

### ❌ useMessages.ts (603 LOC)
- **Path:** `web/frontend/src/hooks/useMessages.ts`
- **Problem:** Hook-Monolith mit Realtime Logic
- **Split in:**
  - [ ] `useMessages.ts` (Main Hook - Query)
  - [ ] `useMessageActions.ts` (Send/Edit/Delete)
  - [ ] `useMessageRealtime.ts` (Realtime Subscriptions)
  - [ ] `messagesService.ts` (API Calls)
- **Priorität:** 🔴 CRITICAL

---

## 🟡 Große Components (400-500 LOC)

### ⚠️ ProjectDetailPage.tsx (477 LOC)
- **Path:** `web/frontend/src/pages/projects/ProjectDetailPage.tsx`
- **Problem:** Page-Komponente zu groß
- **Split in:**
  - [ ] `ProjectDetailPage.tsx` (Layout)
  - [ ] `ProjectHeader.tsx` (Title/Actions)
  - [ ] `ProjectCollaborators.tsx` (Team Section)
  - [ ] `ProjectTracks.tsx` (Tracks List)
  - [ ] `useProjectDetail.ts` (Data Hook)
- **Priorität:** 🟡 HIGH

---

### ⚠️ SendFileModal.tsx (446 LOC)
- **Path:** `web/frontend/src/components/files/SendFileModal.tsx`
- **Problem:** Modal zu komplex
- **Split in:**
  - [ ] `SendFileModal.tsx` (Main Modal)
  - [ ] `FileUploadDropzone.tsx` (Drag & Drop)
  - [ ] `FilePreviewList.tsx` (Preview Cards)
  - [ ] `useSendFile.ts` (Upload Logic)
- **Priorität:** 🟡 HIGH

---

### ⚠️ AudioPlayer.tsx (440 LOC)
- **Path:** `web/frontend/src/components/audio/AudioPlayer.tsx`
- **Problem:** Player zu groß
- **Split in:**
  - [ ] `AudioPlayer.tsx` (Main Component)
  - [ ] `AudioControls.tsx` (Play/Pause/Volume)
  - [ ] `AudioWaveform.tsx` (Visualization)
  - [ ] `AudioTimeline.tsx` (Progress Bar)
  - [ ] `useAudioPlayer.ts` (Playback Logic)
- **Priorität:** 🟡 HIGH

---

### ⚠️ AdminUsers.tsx (410 LOC)
- **Path:** `web/frontend/src/pages/admin/AdminUsers.tsx`
- **Problem:** Admin-Page zu groß
- **Split in:**
  - [ ] `AdminUsers.tsx` (Layout)
  - [ ] `UserTable.tsx` (Table Component)
  - [ ] `UserTableRow.tsx` (Single Row)
  - [ ] `UserFilters.tsx` (Search/Filter)
  - [ ] `useAdminUsers.ts` (Data Hook)
- **Priorität:** 🟡 HIGH

---

## 🔵 Weitere Kandidaten (300-400 LOC)

### 📝 useMessageAttachments.ts (397 LOC)
- **Path:** `web/frontend/src/hooks/useMessageAttachments.ts`
- **Split in:**
  - [ ] `useMessageAttachments.ts` (Main Hook)
  - [ ] `useAttachmentUpload.ts` (Upload Logic)
  - [ ] `attachmentsService.ts` (API)
- **Priorität:** 🔵 MEDIUM

---

### 📝 ChatSidebar.tsx (365 LOC)
- **Path:** `web/frontend/src/components/chat/ChatSidebar.tsx`
- **Split in:**
  - [ ] `ChatSidebar.tsx` (Layout)
  - [ ] `ConversationList.tsx` (List)
  - [ ] `ConversationItem.tsx` (Single Item)
- **Priorität:** 🔵 MEDIUM

---

### 📝 projectsService.ts (356 LOC)
- **Path:** `web/frontend/src/lib/services/projects/projectsService.ts`
- **Review:** Service OK, aber prüfen ob Split sinnvoll
- **Priorität:** 🔵 LOW

---

### 📝 MessageBubble.tsx (344 LOC)
- **Path:** `web/frontend/src/components/social/MessageBubble.tsx`
- **Split in:**
  - [ ] `MessageBubble.tsx` (Main)
  - [ ] `MessageContent.tsx` (Text/Media)
  - [ ] `MessageActions.tsx` (Edit/Delete)
- **Priorität:** 🔵 MEDIUM

---

### 📝 main.tsx (335 LOC)
- **Path:** `web/frontend/src/main.tsx`
- **Review:** Entry Point - ggf. Router Config extrahieren
- **Priorität:** 🔵 LOW

---

### 📝 AdminIssues.tsx (319 LOC)
- **Path:** `web/frontend/src/pages/admin/AdminIssues.tsx`
- **Review:** Prüfen ob Split nötig
- **Priorität:** 🔵 LOW

---

### 📝 AdminFeatureFlags.tsx (315 LOC)
- **Path:** `web/frontend/src/components/admin/AdminFeatureFlags.tsx`
- **Review:** Prüfen ob Split nötig
- **Priorität:** 🔵 LOW

---

## 🧹 Weitere Code Quality Issues

### console.logs entfernen
- **Status:** 303 Vorkommen in 74 Files
- **Aktion:** Systematisch durchgehen + löschen (außer Error-Logs)
- **Priorität:** 🔵 MEDIUM

### TODOs dokumentieren
- **Status:** 24 TODOs nicht in Issues
- **Aktion:** Grep + Issue-Creation
- **Priorität:** 🔵 LOW

### ISSUES.md aktualisieren
- **Status:** Veraltet (2025-10-08)
- **Aktion:** Sync mit Supabase oder löschen
- **Priorität:** 🔵 LOW

---

## 🗄️ SQL Migrations Cleanup

### Problem
- **22 SQL Files** in `docs/architecture/migrations/`
- **Duplikate:** 4x `000_database_cleanup*.sql` (verschiedene Versionen!)
- **Kollisionen:** Mehrere `004_*.sql`, `005_*.sql`, `006_*.sql`, `007_*.sql`
- **Chaos:** Unklare Reihenfolge, keine Migration-Historie

### ✅ Behalten (Executed Migrations)
- [x] `001_create_tables.sql` (✅ DONE)
- [x] `002_create_indexes.sql` (✅ DONE)
- [x] `003_create_triggers.sql` (✅ DONE)
- [x] `010_add_avatar_url.sql` (✅ DONE)
- [x] `011_create_avatars_bucket.sql` (✅ DONE)
- [x] `012_add_artist_profile_fields.sql` (✅ DONE)
- [x] `013_add_privacy_settings.sql` (✅ DONE)

### ✅ Behalten (Utility)
- [x] `CHECK_DATABASE_STATUS.sql` (Diagnostic Tool)
- [x] `README.md` (Migration Guide)

### ❌ Löschen (Duplikate/Legacy) - ✅ DELETED!
- [x] `000_database_cleanup.sql` ✅
- [x] `000_database_cleanup_correct.sql` ✅
- [x] `000_database_cleanup_fixed.sql` ✅
- [x] `000_database_cleanup_universal.sql` ✅
- [x] `004_masterplan_additions.sql` ✅
- [x] `004_shared_files.sql` ✅
- [x] `005_message_attachments_rls.sql` ✅
- [x] `005_storage_bucket_policies.sql` ✅
- [x] `006_create_track_comments.sql` ✅
- [x] `006_message_attachments_delete_fix.sql` ✅
- [x] `007_add_bpm_to_tracks.sql` ✅
- [x] `007_soft_delete_attachments.sql` ✅
- [x] `008_create_collaborators_rls.sql` ✅
- [x] `009_fix_collaborators_rls_recursion.sql` ✅

### ❌ Löschen (Obsolete Docs) - ✅ DELETED!
- [x] `RUN_MIGRATION_004.md` ✅
- [x] `RUN_MIGRATION_005.md` ✅
- [x] `RUN_MIGRATION_006.md` ✅
- [x] `RUN_MIGRATION_007.md` ✅
- [x] `RUN_MIGRATION_010_011.md` ✅

### 📋 Cleanup Plan - ✅ COMPLETED!
1. ✅ **Behalten:** 7 executed migrations + README + CHECK_STATUS
2. ✅ **Gelöscht:** 14 SQL Files + 5 Markdown Docs = **19 Files**
3. ✅ **Ergebnis:** Saubere Migration-History (nur erfolgreiche Migrations)

**Priorität:** 🟡 HIGH ✅ **DONE!**

---

## 📂 Folder-Struktur Review

### Zu prüfen
- [ ] `web/frontend/src/` - Folder-Organisation OK?
- [ ] `web/frontend/src/styles/` - SCSS-Struktur strikt eingehalten?
- [ ] `packages/*` - Shared Packages notwendig oder Overhead?
- [ ] `docs/architecture/` - Veraltete Docs identifizieren
- [ ] `desktop/` - C++ Projekt aktiv oder deprecated?
- [ ] `vst-plugin/` - Geplant aber leer (löschen oder behalten)?

**Priorität:** 🟡 HIGH

---

## 📝 Documentation Cleanup

### Root-Level Docs (12 Files)

**✅ Deleted (6 Files):**
- [x] `ANALYTICS_DEBUG_SESSION.md` ✅
- [x] `CHAT_SIDEBAR_IMPROVEMENTS.md` ✅
- [x] `ISSUES.md` ✅
- [x] `MONOREPO_MIGRATION.md` ✅
- [x] `PR_TEMPLATE_CHAT_SIDEBAR.md` ✅
- [x] `STORAGE_SECURITY_MIGRATION.md` ✅

**✅ Keep (6 Files):**
- [x] `CHANGELOG.md` - Changelog (KEEP + UPDATE)
- [x] `CLAUDE.md` - ✅ **KEEP** (Project Instructions)
- [x] `KNOWN_ISSUES.md` - ✅ **KEEP** (Review later)
- [x] `README.md` - ✅ **KEEP** (Main Readme)
- [x] `REFACTORING.md` - ✅ **KEEP** (This File!)
- [x] `VERCEL_DEPLOYMENT.md` - ✅ **KEEP** (Deployment Doc)

**Priorität:** 🔵 MEDIUM ✅ **DONE!**

---

### docs/ Folder (11 Files)

**Architecture Docs (Review in Vision Phase):**
- [ ] `docs/architecture/00_BIG_PICTURE.md` - Vision (UPDATE für neue Wendung!)
- [ ] `docs/architecture/01_SYSTEM_OVERVIEW.md` - Components (UPDATE)
- [ ] `docs/architecture/02_DATABASE_SCHEMA.md` - SQL Schema (KEEP + UPDATE)
- [ ] `docs/architecture/03_DATA_FLOW.md` - User Journeys (UPDATE)
- [ ] `docs/architecture/04_STORAGE_STRATEGY.md` - File Storage (KEEP)
- [ ] `docs/architecture/05_VST_PLUGIN.md` - JUCE (DELETE wenn nicht geplant!)
- [ ] `docs/architecture/06_DEPLOYMENT.md` - CI/CD (KEEP)

**Masterplan (Keep for Vision):**
- [x] `docs/DEGIXDAW_MASTERPLAN.md` - ✅ **KEEP** (33K - für neue Wendung reviewen!)

**✅ Deleted Session Logs (3 Files):**
- [x] `docs/DATABASE_STATUS_REPORT.md` ✅
- [x] `docs/SESSION_SUMMARY_2025-10-18.md` ✅
- [x] `docs/SESSION_SUMMARY_FILE_UPLOAD_FIX_2025-10-18.md` ✅

**Priorität:** 🟡 HIGH (Vision definieren!)

---

### web/frontend/ Docs (13 Files)

**✅ Deleted Duplicates/Old (5 Files):**
- [x] `web/frontend/ANALYTICS_FEATURES.md` ✅
- [x] `web/frontend/CHAT_SIDEBAR_IMPROVEMENTS.md` ✅
- [x] `web/frontend/ISSUES.md` ✅
- [x] `web/frontend/KNOWN_ISSUES.md` ✅
- [x] `web/frontend/PR_TEMPLATE_CHAT_SIDEBAR.md` ✅

**✅ Keep Root Docs (3 Files):**
- [x] `web/frontend/CHANGELOG.md` - ✅ **KEEP**
- [x] `web/frontend/CLAUDE.md` - ✅ **KEEP** (Frontend Instructions)
- [x] `web/frontend/README.md` - ✅ **KEEP**

**web/frontend/docs/ (7 Files):**
- [x] `web/frontend/docs/README.md` - ✅ **KEEP**
- [ ] `web/frontend/docs/ANALYTICS_REDESIGN.md` - Old Design? (Review later)
- [x] `web/frontend/docs/ANALYTICS_SYSTEM.md` - ✅ **KEEP**
- [x] `web/frontend/docs/FEATURE_FLAGS.md` - ✅ **KEEP**
- [x] `web/frontend/docs/FILE_BROWSER.md` - ✅ **KEEP**
- [x] `web/frontend/docs/FILE_UPLOAD_SIZE_LIMIT.md` - ✅ **KEEP**
- [x] `web/frontend/docs/SUPABASE_SETUP.md` - ✅ **KEEP**
- [x] `web/frontend/docs/TOKEN_MANAGEMENT.md` - ✅ **KEEP**

**Priorität:** 🔵 MEDIUM ✅ **MOSTLY DONE!**

---

## 🗑️ Files & Cleanup

### ⚠️ Security Issues (CRITICAL!)

**Desktop Credentials:**
- [x] `desktop/degixdaw_creds.dat` - ⚠️ **CREDENTIALS FILE!** ✅ **FIXED!**
  - **Aktion:** ✅ `git rm --cached` + `.gitignore` updated
  - **Commit:** a8026ba - "security: remove credentials and add desktop binaries to gitignore"

**Priorität:** 🔴 **CRITICAL** ✅ **DONE!**

---

### 🖼️ Screenshots & Binary Files

**Desktop:**
- [ ] `desktop/screen.JPG` (104 KB) - Screenshot (KEEP or DELETE?)
- [ ] `desktop/debug.log` (430 KB) - Debug Log → **.gitignore!**
- [ ] `desktop/vc140.pdb` (1.5 MB) - PDB File → **.gitignore!**

**Web:**
- [ ] `web/screen1.JPG` - Screenshot (DELETE?)
- [ ] `web/screen2.JPG` (51 KB) - Screenshot (DELETE?)

**Aktion:** `.gitignore` updaten:
- [x] ✅ **DONE!** (Commit a8026ba)

**Priorität:** 🟡 HIGH ✅ **DONE!**

---

### 🗂️ vst-plugin/ Folder

**Status:** Folder existiert NICHT!
- [ ] CLAUDE.md erwähnt: `vst-plugin/` (geplant)
- [ ] Entscheidung: Erstellen oder aus Docs entfernen?

**Priorität:** 🔵 LOW

---

### 📦 packages/ Usage Check

**Shared Packages:**
- [ ] `packages/types/` - Wird benutzt? (grep @degixdaw/types)
- [ ] `packages/utils/` - Wird benutzt? (grep @degixdaw/utils)
- [ ] `packages/constants/` - Wird benutzt? (grep @degixdaw/constants)

**Aktion:** Import-Check durchführen → Behalten oder in Frontend integrieren?

**Priorität:** 🔵 MEDIUM

---

## 🧪 Tests & Jest

### Test Files (10 Files, 904 LOC)

**Test Coverage:**
- [ ] `ChatSidebar.test.tsx` (192 LOC) - 🔴 TOO BIG!
- [ ] `useChatCoordination.test.ts` (172 LOC) - ⚠️ Large
- [ ] `ExpandedChat.test.tsx` (160 LOC) - ⚠️ Large
- [ ] `useConversations.test.tsx` (103 LOC) - ✅ OK
- [ ] `ChatSidebar.upload.test.tsx` (80 LOC) - ✅ OK
- [ ] `useMessages.test.tsx` (69 LOC) - ✅ OK
- [ ] `useConversationMessages.test.tsx` (44 LOC) - ✅ OK
- [ ] `useConversations.error.test.tsx` (42 LOC) - ✅ OK
- [ ] `useGlobalMessagesSubscription.test.tsx` (31 LOC) - ✅ OK
- [ ] `ChatItem.test.tsx` (11 LOC) - ✅ OK

**Problem:**
- Nur **Chat/Hooks** getestet!
- **Keine Tests** für: Admin, Analytics, Social, Files, Audio, Projects, etc.

**Aktion:**
1. [ ] **ChatSidebar.test.tsx** splitten (<192 LOC → <100 LOC)
2. [ ] Tests für neue Components hinzufügen nach Refactoring
3. [ ] Test Coverage erhöhen (aktuell nur ~5% der Components)

**Jest Config:**
- ✅ `jest.config.ts` - ts-jest + jsdom
- ✅ `setupTests.ts` - @testing-library/jest-dom
- ✅ `tsconfig.jest.json` - TypeScript Config (vermutlich)

**Test Command:**
```bash
npm test  # jest --passWithNoTests
```

**Priorität:** 🔵 MEDIUM (nach Code Refactoring)

---

## 📜 Scripts & Utilities

### web/frontend/scripts/ (44 Files!)

**Categories:**

**Analytics Scripts (9):**
- [ ] `analytics/backfill-snapshots-history.js` - History Backfill (DELETE?)
- [ ] `analytics/backfill-snapshots.js` - ✅ KEEP
- [ ] `analytics/backfill-user-data.js` - User Data Backfill (DELETE?)
- [ ] `analytics/check-latest-snapshot.js` - Debug Script (DELETE?)
- [ ] `analytics/check-snapshot-with-service-key.js` - Debug (DELETE?)
- [ ] `analytics/create-snapshot-github-actions.js` - ✅ **KEEP** (Used in CI/CD!)
- [ ] `analytics/load-env.js` - ✅ KEEP (Utility)
- [ ] `analytics/quick-check-db.js` - Debug (DELETE?)
- [ ] `analytics/test-direct-insert.js` - Debug (DELETE?)

**Claude Issue Scripts (8):**
- [ ] `claude-add-comment.js` - ✅ KEEP
- [ ] `claude-complete-issue.js` - ✅ KEEP
- [ ] `claude-create-bug-issue.js` - ✅ KEEP
- [ ] `claude-create-issue-batch-NOW.js` - Temp? (DELETE?)
- [ ] `claude-create-issue-batch.js` - ✅ KEEP
- [ ] `claude-create-issue-OLD.js` - ❌ **DELETE** (OLD Version!)
- [ ] `claude-create-issue.js` - ✅ **KEEP**
- [ ] `claude-list-all-issues.js` - ✅ KEEP
- [ ] `claude-read-issue.js` - ✅ KEEP
- [ ] `claude-start-issue.js` - ✅ KEEP

**DB Scripts (?):**
- [ ] Review `db/*.js` files (cleanup, migrate, seed, etc.)

**Check Scripts (?):**
- [ ] `check-admin-user.js` - Debug? (DELETE?)
- [ ] `check-all-users.js` - Debug? (DELETE?)
- [ ] `check-db-connection.js` - Debug? (DELETE?)
- [ ] `check-storage-buckets.js` - Debug? (DELETE?)

**Debug Files:**
- [ ] `web/frontend/debug-friendlist-avatars.cjs` - ❌ **DELETE** (Temp Debug!)

**Aktion:** Sortieren in:
- ✅ **Keep:** Production scripts (CI/CD, Claude, Utilities)
- ❌ **Delete:** Debug/Temp/Old scripts (~15 Files?)

**Priorität:** 🔵 MEDIUM

---

## 📊 Summary

### Code Refactoring
- **Total Files:** 15 Monoliths
- **Critical (>600 LOC):** 4
- **High (400-500 LOC):** 4
- **Medium (300-400 LOC):** 7
- **Completed:** 0 / 15 (0%)

### SQL Migrations
- **Delete:** 19 Files (14 SQL + 5 MD)
- **Keep:** 9 Files (7 Migrations + 2 Utility)

### Documentation
- **Root:** 12 Docs (7 DELETE/ARCHIVE, 5 KEEP)
- **docs/:** 11 Docs (4 ARCHIVE, 7 UPDATE/KEEP)
- **web/frontend/:** 13 Docs (6 DELETE, 7 KEEP)
- **Total:** 36 Docs → ~20 DELETE/ARCHIVE

### Security & Files
- **CRITICAL:** `desktop/degixdaw_creds.dat` (Credentials!)
- **Binary Files:** 5 Files (.JPG, .log, .pdb)
- **.gitignore:** Update needed

### Tests
- **Test Files:** 10 (904 LOC total)
- **Test Monoliths:** 1 File (ChatSidebar.test.tsx, 192 LOC)
- **Coverage:** ~5% (nur Chat/Hooks getestet)
- **Missing Tests:** Admin, Analytics, Social, Files, Audio, Projects

### Scripts
- **Total Scripts:** 44 (web/frontend/scripts/)
- **Obsolete/Debug:** ~15 Files (DELETE)
- **Keep:** ~29 Files (Production/CI/CD/Utilities)

### Total Cleanup Impact
- **~70+ Files** zu prüfen/löschen/archivieren
- **15 Code Monoliths** zu refactoren
- **1 Test Monolith** zu splitten
- **~15 Debug Scripts** zu löschen
- **Test Coverage** drastisch erhöhen (5% → 50%+)
- **1 Security Issue** zu fixen

---

## 🎯 Next Steps (Priorisierung)

### Phase 1: CRITICAL (SOFORT!)
1. [ ] **Security:** `desktop/degixdaw_creds.dat` prüfen (committed?)
2. [ ] **.gitignore:** Desktop binaries hinzufügen

### Phase 2: Quick Wins (5-10min)
3. [ ] **SQL Cleanup:** 19 obsolete Migration-Files löschen
4. [ ] **Doc Cleanup:** Duplikate löschen (ISSUES.md, KNOWN_ISSUES.md, etc.)

### Phase 3: Vision definieren (30-60min)
5. [ ] **Neue Wendung:** Was bleibt? (VST Plugin, Desktop, MIDI Editor?)
6. [ ] **Architecture Docs:** Updaten basierend auf neuer Vision
7. [ ] **CLAUDE.md:** Neu schreiben

### Phase 4: Code Refactoring (Mehrere Tage)
8. [ ] **Feature-Branch:** `refactor/code-cleanup` erstellen
9. [ ] **Top 4 Monoliths:** FileBrowser, CodeGrowthChart, useConversations, useMessages
10. [ ] **Systematisch:** Rest abarbeiten (400+ LOC Files)

### Phase 5: Polishing
11. [ ] **console.logs:** 303 entfernen
12. [ ] **TODOs:** 24 dokumentieren
13. [ ] **Tests:** Nach jedem Refactoring

---

**Regel:** Kein File >400 LOC! (Clean Code Prinzip)

**Nächster Schritt:** User-Entscheidung → Was zuerst? Security? Quick Wins? Vision?
