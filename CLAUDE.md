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

Siehe `scripts/db/README.md` und `scripts/sql/README.md` für detaillierte Datenbank-Management-Dokumentation.

## Architektur-Übersicht

### Authentifizierung & Autorisierung

**Authentifizierungs-Flow:**
- Supabase Auth mit Email/Passwort + OAuth (Google, Discord)
- Routen-Schutz via `PrivateRoute`-Komponente ([src/components/auth/PrivateRoute.tsx](src/components/auth/PrivateRoute.tsx))
- Onboarding-System erzwingt Benutzernamen-Auswahl für neue User ([src/lib/auth/onboardingCheck.ts](src/lib/auth/onboardingCheck.ts))
- Auth-State wird vom `useAuth`-Hook verwaltet ([src/hooks/useAuth.ts](src/hooks/useAuth.ts))

**Autorisierungs-Ebenen:**
1. **Admin-System** ([src/hooks/useAdmin.ts](src/hooks/useAdmin.ts)):
   - Super Admin: Via `VITE_SUPER_ADMIN_EMAIL` Umgebungsvariable
   - Regulärer Admin: Via `user_metadata.is_admin` Flag
   - Moderator: Via `user_metadata.is_moderator` Flag
   - Geschützt via `AdminRoute`-Komponente ([src/components/admin/AdminRoute.tsx](src/components/admin/AdminRoute.tsx))

2. **Feature Flags** ([src/lib/constants/featureFlags.ts](src/lib/constants/featureFlags.ts)):
   - Rollenbasierter Zugriff: `public`, `user`, `moderator`, `admin`
   - Feature-Toggles gespeichert in localStorage
   - Geschützt via `FeatureFlagRoute`-Komponente ([src/components/auth/FeatureFlagRoute.tsx](src/components/auth/FeatureFlagRoute.tsx))
   - Admin kann Flags unter `/admin/features` verwalten

**Wichtige Konzepte:**
- Neue User benötigen IMMER Onboarding (Benutzernamen-Auswahl) nach der Registrierung
- Profilerstellung erfolgt automatisch, aber Onboarding stellt sicher, dass der Benutzername gesetzt wird
- Auth-State-Checks erfolgen bei Initialisierung via `useAuth.initialized` Flag
- Admin-Routen leiten zu `/404` weiter (nicht `/welcome`), um Existenz vor Nicht-Admins zu verbergen
- Feature Flags unterstützen Multi-Rollen-Zugriff und können via Admin-Panel getoggelt werden

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
- `AdminRoute`: Prüft Admin/Super-Admin-Rolle
- `FeatureFlagRoute`: Prüft Feature-Flag + Rollen-Zugriff

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

**Zugriff prüfen:**
```typescript
import { canAccessFeature, getUserRole } from './lib/constants/featureFlags';

const { isAdmin, isModerator } = useAdmin();
const userRole = getUserRole(isAdmin, isModerator);
const hasAccess = canAccessFeature('feature_id', userRole, isAdmin);
```

**Feature togglen (nur Admin):**
```typescript
import { toggleFeature, updateAllowedRoles } from './lib/constants/featureFlags';

toggleFeature('feature_id', true);
updateAllowedRoles('feature_id', ['user', 'admin']);
```

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

## Häufige Probleme

**Port bereits in Verwendung:**
Vite läuft auf Port 5173 mit `strictPort: true`. Falls Port belegt ist, beende den Prozess oder ändere den Port in [vite.config.ts](vite.config.ts).

**Admin-Zugriff funktioniert nicht:**
Überprüfe, ob `VITE_SUPER_ADMIN_EMAIL` exakt mit der E-Mail deines Users übereinstimmt. Reguläre Admins benötigen `is_admin: true` in ihren User-Metadaten.

**Feature-Flag wird nicht angewendet:**
Feature-Flags werden in localStorage mit dem Key `app_feature_flags` gespeichert. Lösche localStorage oder nutze das Admin-Panel unter `/admin/features` zum Zurücksetzen.

**Onboarding-Schleife:**
Falls in Onboarding-Schleife gefangen, prüfe:
1. Profil existiert in `profiles`-Tabelle mit gültigem Benutzernamen
2. `user_metadata.needs_username_onboarding` ist `false`
3. Browser-Cache/localStorage löschen

**Ungelesen-Count wird nicht aktualisiert:**
Ungelesen-Counts hängen ab von:
1. `conversation_members.last_read_at` Zeitstempel
2. Nachrichten mit `created_at > last_read_at` UND `sender_id != current_user`
3. Rufe `markAsRead()` auf, um Zeitstempel zu aktualisieren

## Dokumentation

Zusätzliche Dokumentation in `/docs`:
- [docs/README.md](docs/README.md): Dokumentations-Index
- [docs/PROJECT_SUMMARY.md](docs/PROJECT_SUMMARY.md): Detaillierte Architektur
- [docs/SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md): Datenbank-Setup-Anleitung
- [docs/TOKEN_MANAGEMENT.md](docs/TOKEN_MANAGEMENT.md): Auth-Token-Handling
- [DEPLOYMENT.md](DEPLOYMENT.md): Production-Deployment-Anleitung
- [scripts/db/README.md](scripts/db/README.md): Datenbank-Skript-Verwendung
- [scripts/sql/README.md](scripts/sql/README.md): SQL-Datei-Dokumentation
