# CLAUDE.md

Diese Datei bietet Anleitungen für Claude Code (claude.ai/code) bei der Arbeit mit Code in diesem Repository.

## Projektübersicht

DegixDAW Frontend ist eine professionelle React 19 + TypeScript Musik-Kollaborationsplattform mit DAW-Integration, Echtzeit-Chat, Social-Features und einem umfassenden Admin-System. Gebaut mit Vite, Supabase-Backend und SCSS-Styling.

## Entwicklungsbefehle

### Kern-Befehle
```bash
npm run dev              # Vite Dev-Server (Port 5173)
npm run build            # TypeScript-Check + Production-Build
npm run lint             # ESLint Code-Checks
npm run preview          # Vorschau des Production-Builds
npm test                 # Jest-Tests ausführen
```

### Full-Stack-Entwicklung
```bash
npm run api              # Lokalen Express API-Server starten
npm run app              # Frontend + API gleichzeitig ausführen
```

### Datenbank-Operationen
```bash
npm run db:migrate       # Datenbank-Migrationen ausführen
npm run db:seed          # Datenbank mit Testdaten befüllen
npm run db:cleanup       # Datenbank aufräumen
npm run db:sync-profiles # User-Profile mit Auth synchronisieren
npm run db:sql           # SQL-Skripte ausführen
npm run db:show          # SQL-Datei-Inhalte anzeigen
```

### Analytics-Operationen
```bash
npm run analytics:snapshot          # Snapshot manuell erstellen (lokal testen)
npm run analytics:backfill          # Historische Snapshots befüllen
npm run analytics:setup-cron        # pg_cron Setup (Supabase Pro)
npm run analytics:setup-function    # DB-Funktionen ohne Cron (Free Tier)
```

**Automatische Snapshots:** Via GitHub Actions (empfohlen) - siehe `scripts/analytics/GITHUB_ACTIONS_SETUP.md`

Siehe `scripts/db/README.md`, `scripts/sql/README.md` und `scripts/analytics/README.md` für detaillierte Dokumentation.

## Architektur-Übersicht

### Authentifizierung & Autorisierung

**Authentifizierungs-Flow:**
- Supabase Auth mit Email/Passwort + OAuth (Google, Discord)
- Routen-Schutz via `PrivateRoute`-Komponente ([src/components/auth/PrivateRoute.tsx](src/components/auth/PrivateRoute.tsx))
- Onboarding-System erzwingt Benutzernamen-Auswahl für neue User ([src/lib/auth/onboardingCheck.ts](src/lib/auth/onboardingCheck.ts))
- Auth-State wird vom `useAuth`-Hook verwaltet ([src/hooks/useAuth.ts](src/hooks/useAuth.ts))

**Autorisierungs-Ebenen:**
1. **Role-Based Admin-System** ([src/hooks/useAdmin.ts](src/hooks/useAdmin.ts)):
   - **Super Admin**: Via `VITE_SUPER_ADMIN_EMAIL` (🛡️ komplett geschützt, kann von NIEMANDEM editiert/gelöscht werden)
   - **Admin**: Via `profiles.role = 'admin'` (volle Rechte, kann alle Roles verwalten, kann sich nicht selbst degradieren)
   - **Moderator**: Via `profiles.role = 'moderator'` (kann User ↔ Beta-User ↔ Moderator ändern, NICHT zu Admin)
   - **Beta-User**: Via `profiles.role = 'beta_user'` (🧪 Premium Tester, früher Zugriff, Feedback geben)
   - **User**: Standard-Role für alle neuen User
   - **User-Management**: `/admin/users` - Edit, Delete, Bulk Role-Change ([src/hooks/useBulkOperations.ts](src/hooks/useBulkOperations.ts))
   - **Protections**:
     - Self-Demotion verhindert (Admin/Mod kann sich nicht selbst runterstufen)
     - Super-Admin Edit/Delete Buttons disabled im Frontend
     - DB-Trigger verhindert unerlaubte Role-Changes
   - Geschützt via `AdminRoute`-Komponente ([src/components/admin/AdminRoute.tsx](src/components/admin/AdminRoute.tsx))
   - SQL Setup: [scripts/sql/admin_role_system_setup.sql](scripts/sql/admin_role_system_setup.sql) + [ADMIN_ROLE_SYSTEM.md](scripts/sql/ADMIN_ROLE_SYSTEM.md)

   **🔐 Granulare Admin Route Permissions** (NEU):
   - Super-Admin kann **pro Admin/Moderator** festlegen, welche `/admin/*` Routen zugänglich sind
   - Route-Definitionen: [src/lib/constants/adminRoutes.ts](src/lib/constants/adminRoutes.ts)
   - UI: User-Edit-Modal zeigt Multi-Select mit Route-Checkboxen (Dashboard, Users, Issues, Settings, Features, Versions)
   - Storage: `user_metadata.allowed_admin_routes` (Array von Route-IDs, z.B. `['issues', 'users']`)
   - Protection: `AdminRoute` prüft via `canAccessRoute(requiredRoute)` ob Zugriff erlaubt
   - Super-Admin Bypass: Hat IMMER Zugriff auf alle Routen (kein Check nötig)
   - **Beispiel**: Moderator "rdegi" bekommt nur Zugriff auf `/admin/issues` → Alle anderen Admin-Routen leiten zu `/404`
   - **SQL Fix erforderlich**: `npm run db:sql fix_get_all_users_rpc` (behebt 400 Error bei User-Edit)

2. **Feature Flags** ([src/lib/services/featureFlags/](src/lib/services/featureFlags/)):
   - **Supabase Backend** mit Realtime-Updates (seit v1.0.0)
   - Rollenbasierter Zugriff: `public`, `user`, `moderator`, `admin`
   - Service Layer: `featureFlagsService.ts` (CRUD), `helpers.ts` (Utilities), `types.ts`
   - Legacy Adapter: [src/lib/constants/featureFlags.ts](src/lib/constants/featureFlags.ts) für Backward Compatibility
   - React Hook: `useFeatureFlags()` ([src/hooks/useFeatureFlags.ts](src/hooks/useFeatureFlags.ts))
   - Geschützt via `FeatureFlagRoute`-Komponente ([src/components/auth/FeatureFlagRoute.tsx](src/components/auth/FeatureFlagRoute.tsx))
   - Admin kann Flags unter `/admin/features` verwalten (Premium UI mit Pending Changes Pattern)

**Wichtige Konzepte:**
- Neue User benötigen IMMER Onboarding (Benutzernamen-Auswahl) nach der Registrierung
- Profilerstellung erfolgt automatisch, aber Onboarding stellt sicher, dass der Benutzername gesetzt wird
- Auth-State-Checks erfolgen bei Initialisierung via `useAuth.initialized` Flag
- Admin-Routen leiten zu `/404` weiter (nicht `/welcome`), um Existenz vor Nicht-Admins zu verbergen
- Feature Flags unterstützen Multi-Rollen-Zugriff und können via Admin-Panel getoggelt werden
- **Super Admin Protection**: Super Admin kann weder gelöscht noch role-degraded werden (UI + DB-Level)
- **Role-Sync**: Roles werden automatisch in `user_metadata` (is_admin, is_moderator) gespiegelt

### Echtzeit-Chat-System

Das Chat-System nutzt Supabase Realtime für Live-Messaging zwischen Freunden:

**Datenbank-Schema:**
- `conversations`: Speichert Chat-Metadaten (direkt/Gruppe, Zeitstempel)
- `conversation_members`: Verknüpfungstabelle mit User-Teilnahme, Lesestatus, Pinned-Status
- `messages`: Chat-Nachrichten mit Sender, Inhalt, Anhänge, Soft Deletes
- `friendships`: Freundschafts-Verbindungen erforderlich, um Konversationen zu sehen

**Wichtige Hooks:**
- `useConversations` ([src/hooks/useConversations.ts](src/hooks/useConversations.ts)): Konversationsliste, Erstellung, Ungelesen-Counts
- `useMessages`: Nachrichten laden, senden, Echtzeit-Subscriptions
- `useConversationMessages`: Pro-Konversations-Nachrichten-Management
- `useChatCoordination`: Orchestriert Chat-UI-State und Datensynchronisation

**Wichtige Regeln:**
- Nur Direkt-Chats zwischen Freunden werden angezeigt (gefiltert in `loadConversations`)
- Ungelesen-Counts berechnet durch Vergleich `created_at` vs `last_read_at` nur für eingehende Nachrichten
- `markAsRead` aktualisiert `conversation_members.last_read_at` auf aktuellen Zeitstempel
- `optimisticallyMarkAsRead` aktualisiert UI sofort vor Server-Bestätigung
- Echtzeit-Subscriptions laden Konversationen bei INSERT in `messages`-Tabelle neu

### Validierungs-System

Zod-basierte Validierung mit asynchronen Checks:

**Speicherort:** `src/lib/validation/`
- `authValidation.ts`: Email, Passwortstärke, Benutzernamen-Format
- `profileValidation.ts`: Profil-Felder
- `commonValidation.ts`: Gemeinsame Validatoren

**Benutzernamen-Validierungsregeln:**
- 3-20 Zeichen, nur Kleinbuchstaben/Zahlen/Bindestriche/Unterstriche
- Darf "admin" nicht enthalten (case-insensitive)
- Async-Check auf Verfügbarkeit via `checkUsernameExists` ([src/lib/supabase.ts](src/lib/supabase.ts))

**Passwort-Anforderungen:**
- Mindestens 6 Zeichen
- Mindestens ein Großbuchstabe, ein Kleinbuchstabe, eine Zahl

### Code-Splitting-Strategie

Konfiguriert in [vite.config.ts](vite.config.ts):

**Manuelle Chunks:**
- `react-vendor`: React, React DOM, React Router
- `supabase-vendor`: Supabase Client
- `zod-vendor`: Zod Validierung
- `utils`: Auth Utils, Username Generator, URL Utils
- `validation`: Alle Validierungs-Schemas
- `hooks`: Kern-Hooks (useAuth, useConversations, useMessages)
- `auth-pages`: Login, Signup, Auth Callback Pages
- `dashboard-pages`: Haupt-Dashboard
- `recovery-pages`: Account-Recovery-Flows

Alle Routen nutzen React.lazy() für dynamische Imports mit `<Suspense fallback={<PageLoader />}>`.

### Router-Konfiguration

**Routen-Struktur** ([src/main.tsx](src/main.tsx)):
- `/welcome`: Öffentliche Landing-Page mit Login/Signup
- `/`: Geschütztes App-Layout mit verschachtelten Routen
  - `/` (index): Dashboard (benötigt `dashboard` Feature-Flag)
  - `/social`: Social-Features (benötigt `social_features` Feature-Flag)
  - `/settings`: User-Einstellungen
  - `/files`: Datei-Browser (benötigt `file_browser` Feature-Flag)
- `/admin/*`: Admin-Panel (benötigt Admin-Rolle, nutzt `AdminLayoutCorporate`)
  - `/admin`: Admin-Dashboard
  - `/admin/users`: User-Verwaltung
  - `/admin/issues`: Issue-Tracking
  - `/admin/settings`: Admin-Einstellungen
  - `/admin/features`: Feature-Flag-Verwaltung
- `/auth/*`: Auth-Flows (kein Layout)
- `/onboarding/username`: Benutzernamen-Auswahl für neue User

**Routen-Schutz:**
- `PrivateRoute`: Prüft Authentifizierung
- `AdminRoute`: Prüft Admin/Super-Admin-Rolle + optional `requiredRoute` (granulare Permissions)
- `FeatureFlagRoute`: Prüft Feature-Flag + Rollen-Zugriff

### Issues System

Supabase-basiertes Issue-Tracking-System für Bug-Reports, Feature-Requests und Task-Management:

**Datenbank-Schema:**
- `issues`: Kern-Tabelle (title, description, status, priority, category, labels, assigned_to, created_by, metadata)
- `issue_comments`: Kommentare + Action-Log (comment, action_type, metadata)
- RPC-Funktion: `get_issues_with_details()` (mit User-Info + Comments-Count)
- RPC-Funktion: `assign_issue()` (mit Lock-Protection gegen Doppel-Assignments)

**Service Layer** ([src/lib/services/issues/](src/lib/services/issues/)):
- `issuesService.ts`: CRUD Operations, Assignment, Bulk-Actions
- `commentsService.ts`: Kommentare laden, erstellen, löschen
- `helpers.ts`: Filter, Sorting, Stats-Berechnung
- `types.ts`: TypeScript-Interfaces

**React Hooks:**
- `useIssues` ([src/hooks/useIssues.ts](src/hooks/useIssues.ts)): Issues laden, CRUD, Assignment, Filter, Stats
- `useIssueComments` ([src/hooks/useIssueComments.ts](src/hooks/useIssueComments.ts)): Kommentare laden, erstellen, Realtime

**UI-Komponenten:**
- `AdminIssues`: Haupt-Page mit Filters, Bulk-Actions, Create/Edit
- `IssueCard`: Einzelnes Issue mit Status, Priority, Labels, Assignment-Button
- `IssueList`: Tabellen-/Karten-View mit Bulk-Select
- `IssueModalEnhanced`: Create/Edit-Modal mit Labels-Multi-Select, Categories, PR-URL
- `IssueCommentPanel`: Sidebar für Kommentare

**Features:**
- Status: open, in_progress, done, closed
- Priority: low, medium, high, critical (mit Smart-Sorting)
- Categories: Custom-Categories via localStorage ([src/lib/constants/categories.ts](src/lib/constants/categories.ts))
- Labels: bug, feature, urgent, docs, enhancement, question
- Assignment mit Lock-Protection (verhindert race conditions)
- PR-URL Integration (für "done" Issues)
- Comments mit Action-Types (comment, status_change, assignment, label_change)

**Wichtige Hinweise:**
- **Realtime nicht zuverlässig**: UI nutzt **manuelle Refreshs** nach CRUD-Operationen (create/update/assign)
- **RPC Type Fix**: `npm run db:sql fix_rpc_type_mismatch` behebt Column-Type-Mismatch
- Status-Format: `in_progress` (underscore, nicht hyphen!)
- SQL Setup: [scripts/sql/issues_system_setup.sql](scripts/sql/issues_system_setup.sql)

## Wichtige Entwicklungsmuster

### Erforderliche Umgebungsvariablen

Erstelle `.env.local`:
```env
VITE_SUPABASE_URL=deine_supabase_url
VITE_SUPABASE_ANON_KEY=dein_anon_key
VITE_SUPER_ADMIN_EMAIL=admin@example.com  # Für Super-Admin-Zugriff
```

### Arbeiten mit Auth

**Signup-Flow:**
1. User registriert sich via `useAuth.signUpWithEmail()`
2. Profil wird automatisch mit temporärem Benutzernamen erstellt
3. User wird zu `/onboarding/username` weitergeleitet, um Benutzernamen auszuwählen
4. `user_metadata.needs_username_onboarding` wird nach Abschluss auf `false` gesetzt

**User-Rolle prüfen:**
```typescript
const { isAdmin, isSuperAdmin, isModerator, adminLevel } = useAdmin();
```

**Routen schützen:**
```tsx
<PrivateRoute>
  <FeatureFlagRoute featureFlag="dashboard">
    <Dashboard />
  </FeatureFlagRoute>
</PrivateRoute>
```

### Arbeiten mit Feature-Flags

**Feature-Flags laden und überwachen:**
```typescript
import { useFeatureFlags } from './hooks/useFeatureFlags';

const { features, loading, error, refresh } = useFeatureFlags();
// features = Array von FeatureFlag-Objekten mit Realtime-Updates
```

**Zugriff prüfen:**
```typescript
import { canAccessFeature, getUserRole } from './lib/constants/featureFlags';

const { features } = useFeatureFlags();
const { isAdmin, isModerator } = useAdmin();
const userRole = getUserRole(!!user, isAdmin, isModerator);

const feature = features.find(f => f.id === 'feature_id');
const hasAccess = canAccessFeature(feature, userRole, isAdmin);
```

**Feature togglen (nur Admin):**
```typescript
// Legacy API (synchron mit optimistic updates)
import { toggleFeature, updateAllowedRolesAsync } from './lib/constants/featureFlags';

toggleFeature('feature_id', true);

// Async API (empfohlen für neue Code)
const { data, error } = await updateAllowedRolesAsync('feature_id', ['user', 'admin']);
```

**Wichtige Hinweise:**
- Feature-Flags werden in Supabase gespeichert (Tabelle: `feature_flags`)
- Realtime-Updates via Supabase Subscriptions
- Admin-UI unter `/admin/features` nutzt Pending Changes Pattern (explizites Speichern)
- RLS Policy nutzt `auth.jwt() -> 'user_metadata' ->> 'is_admin'` für Permission-Checks

### Arbeiten mit Chat

**Direkt-Konversation erstellen/öffnen:**
```typescript
const { createOrOpenDirectConversation } = useConversations();
const conversationId = await createOrOpenDirectConversation(friendUserId);
```

**Konversation als gelesen markieren:**
```typescript
const { markAsRead, optimisticallyMarkAsRead } = useConversations();

// Optimistisches UI-Update (sofort)
optimisticallyMarkAsRead(conversationId);

// Server-Update (asynchron)
await markAsRead(conversationId);
```

**Echtzeit-Nachrichten:**
Nachrichten werden automatisch via Supabase-Subscriptions aktualisiert. Der `useMessages`-Hook übernimmt:
- Laden existierender Nachrichten
- Abonnieren neuer Nachrichten
- Optimistische Updates für gesendete Nachrichten

### Profil-Verwaltung

**Aktuelles Passwort verifizieren:**
Nutze `verifyCurrentPassword()` aus [src/lib/supabase.ts](src/lib/supabase.ts) vor Passwort-Änderungen.

**Profil-Aktionen:**
Siehe [src/lib/profile/profileActions.ts](src/lib/profile/profileActions.ts) für zentralisierte Profil-Update-Logik.

### Admin User-Management

**User-Verwaltung unter `/admin/users`:**

Das Admin-Panel bietet umfassende User-Management-Funktionen:

**Single-User-Operations:**
- **Edit User** ([UserEditModal.tsx](src/pages/admin/components/modals/UserEditModal.tsx)):
  - Role-Änderung: User ↔ Beta-User ↔ Moderator ↔ Admin
  - Full Name, Username, Email-Anpassung
  - Self-Demotion Prevention: Admin/Moderator kann sich nicht selbst degradieren
  - Super-Admin Protection: Edit-Button disabled für `VITE_SUPER_ADMIN_EMAIL`

- **Delete User** ([UserDeleteModal.tsx](src/pages/admin/components/modals/UserDeleteModal.tsx)):
  - Löscht Profile aus `profiles`-Tabelle (NICHT `auth.users`, da Service Role Key im Frontend nicht verfügbar)
  - Super-Admin Protection: Delete-Button disabled + Warnung

**Bulk-Operations** ([useBulkOperations.ts](src/hooks/useBulkOperations.ts)):
- **Bulk Activate/Deactivate**: Setzt `is_active` für mehrere User gleichzeitig
- **Bulk Role Change**: Ändert Roles für mehrere User (mit Dropdown-Auswahl: User, Beta-User, Moderator, Admin)
- **Bulk Delete**: Löscht mehrere User gleichzeitig (mit Confirmation)
- UI: Checkbox-Selection in [UserTableRow.tsx](src/components/admin/UserTableRow.tsx) + [BulkActionsModal.tsx](src/pages/admin/components/modals/BulkActionsModal.tsx)

**Wichtige Regeln:**
- User-Daten werden via RPC-Function `get_all_users_with_metadata()` geladen (JOIN `auth.users` + `profiles`)
- RLS Policies erlauben nur Admin-Zugriff (JWT-basiert: `auth.jwt() -> 'user_metadata' ->> 'is_admin'`)
- Self-Demotion wird via Frontend-Check UND DB-Trigger verhindert ([prevent_self_demotion](scripts/sql/admin_role_system_setup.sql))
- Super-Admin ist via `VITE_SUPER_ADMIN_EMAIL` definiert und kann von NIEMANDEM geändert/gelöscht werden

## Testing

Jest konfiguriert mit:
- `@testing-library/react` für Komponenten-Testing
- `ts-jest` für TypeScript-Support
- `jest-environment-jsdom` für DOM-Umgebung
- Siehe [jest.config.ts](jest.config.ts) für Konfiguration

Tests ausführen:
```bash
npm test                 # Alle Tests ausführen
npm test -- --watch      # Watch-Modus
```

## Git Workflow & Deployment

**WICHTIG: Immer vor Push den Build testen!**
```bash
npm run build            # TypeScript-Check + Production-Build
```

**Branch-Strategie:**
- `main`: Production-Branch (deployed zu Netlify)
- `develop`: Integration-Branch für Features
- `feature/*`: Feature-Branches

**Vor jedem Merge zu `main`:**
1. `npm run build` ausführen (TypeScript-Errors blocken Netlify Build!)
2. Alle TypeScript-Errors fixen
3. Commit + Push zu Feature-Branch
4. Merge zu `develop`
5. Test auf `develop`
6. Merge zu `main` → Netlify Auto-Deploy

**Netlify Build Config:**
- Build Command: `npm run build`
- Publish Directory: `dist`
- Environment Variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

## Häufige Probleme

**User-Tabelle in Admin-Panel ist leer:**
Das häufigste Problem bei neuen Projekten! Die RPC-Function `get_all_users_with_metadata()` fehlt in Supabase.

**3-Schritte-Lösung:**
```bash
# 1. Script-Inhalt anzeigen
npm run db:show scripts/sql/admin_role_system_setup.sql

# 2. Öffne Supabase SQL-Editor
# https://supabase.com/dashboard/project/YOUR_PROJECT/sql

# 3. Kopiere Script-Inhalt, klicke "Run" ✅
```

**Danach:** User-Tabelle zeigt alle angemeldeten User + Role-System ist aktiv!

Siehe [scripts/sql/README.md](scripts/sql/README.md) für Details zum Admin-Role-System-Setup.

**Port bereits in Verwendung:**
Vite läuft auf Port 5173 mit `strictPort: true`. Standard-Start: `npm run dev`. Wenn Port belegt, Prozess beenden oder Port in [vite.config.ts](vite.config.ts) ändern (nur für andere Entwickler).

**Admin-Zugriff funktioniert nicht:**
Überprüfe, ob `VITE_SUPER_ADMIN_EMAIL` exakt mit der E-Mail deines Users übereinstimmt. Reguläre Admins benötigen `is_admin: true` in ihren User-Metadaten.

**Supabase Realtime-Verbindung trennt:**
Falls Feature-Flags oder Chat-Updates nicht ankommen:
1. Browser Console prüfen auf `[FeatureFlagsService]` oder `[Realtime]` Fehler
2. Supabase Dashboard → Settings → API → Realtime aktiviert?
3. RLS Policies in `feature_flags` und `messages` Tabellen korrekt?
4. Network Tab prüfen: WebSocket-Verbindung zu Supabase aktiv?

**TypeScript Build-Fehler:**
`npm run build` schlägt fehl? Prüfe:
1. `npm run lint` für ESLint-Errors
2. IDE zeigt TypeScript-Fehler inline
3. `tsconfig.json` Strict-Mode-Einstellungen

## Dokumentation

Zusätzliche Dokumentation in `/docs`:
- [docs/README.md](docs/README.md): Dokumentations-Index
- [docs/PROJECT_SUMMARY.md](docs/PROJECT_SUMMARY.md): Detaillierte Architektur
- [docs/SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md): Datenbank-Setup-Anleitung
- [docs/TOKEN_MANAGEMENT.md](docs/TOKEN_MANAGEMENT.md): Auth-Token-Handling
- [DEPLOYMENT.md](DEPLOYMENT.md): Production-Deployment-Anleitung
- [scripts/db/README.md](scripts/db/README.md): Datenbank-Skript-Verwendung
- [scripts/sql/README.md](scripts/sql/README.md): SQL-Datei-Dokumentation
