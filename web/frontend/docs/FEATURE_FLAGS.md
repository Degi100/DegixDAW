# 🎛️ Feature-Flags System

**Version:** 2.0.0 (Supabase Backend)
**Last Updated:** 2025-10-28
**Status:** ✅ Production Ready

## Übersicht

Das **Feature-Flags System** ermöglicht es, Features in Production **schrittweise** freizuschalten - **ohne neuen Deploy**! Features werden in **Supabase gespeichert** und können via **Admin-Panel** in Echtzeit geändert werden.

### 🎉 Was ist NEU in v2.0?

- ✅ **Supabase Backend**: Persistierung in `feature_flags` Tabelle (statt in-memory!)
- ✅ **Realtime Updates**: Änderungen synchronisieren sofort über alle Clients
- ✅ **Role-Based Access**: JSONB Array `["public", "user", "moderator", "admin"]`
- ✅ **Admin Panel**: Toggle Features via `/admin/features`
- ✅ **Audit Log**: `created_by`, `updated_by`, `updated_at` Tracking
- ✅ **Categories**: Gruppierung (core, chat, files, cloud, admin, etc.)

### Was du als Admin kannst:

- ✅ Features aktivieren/deaktivieren (1 Klick)
- 🔒 Features nur für Admins sichtbar machen
- 🧪 Features für Moderators/Beta-Tester freigeben
- 🌍 Features für alle User veröffentlichen
- 📊 Feature-Status in Echtzeit sehen

---

## 🚀 Workflow

### **Traditionell (Alt):**
```
develop → testen → main deploy → ALLE sehen Feature
                                ↓
                          Problem? → Hotfix → neuer Deploy
```

### **Mit Feature-Flags v2.0 (Neu):**
```
develop → main deploy (Feature disabled in Supabase)
                ↓
         Admin öffnet /admin/features
                ↓
         Toggle "enabled" + Set "allowed_roles": ["admin"]
                ↓
         Testen in Production ✓ (nur Admins sehen es)
                ↓
         Set "allowed_roles": ["user", "moderator", "admin"]
                ↓
         Feature für alle aktivieren! (Realtime Update)
                ↓
         Problem? → Toggle "enabled" OFF (1 Klick, sofort!)
```

---

## 📁 Architektur

### Dateistruktur

```
src/
├── lib/
│   ├── services/
│   │   └── featureFlags/
│   │       ├── featureFlagsService.ts   # Supabase CRUD
│   │       ├── helpers.ts               # Role-Check Logic
│   │       └── types.ts                 # TypeScript Interfaces
│   └── constants/
│       └── featureFlags.ts              # DEPRECATED: Legacy Adapter
├── components/
│   ├── admin/
│   │   └── AdminFeatureFlags.tsx        # Admin Toggle-Panel (/admin/features)
│   ├── auth/
│   │   └── FeatureFlagRoute.tsx         # Feature-gated Routes
│   └── layout/
│       └── Header.tsx                   # Navigation mit Flag-Check
├── hooks/
│   └── useFeatureFlags.ts               # React Hook mit Realtime
└── scripts/
    └── sql/
        └── feature_flags_setup.sql      # DB Setup Script
```

### Datenfluss

```
Admin Panel (/admin/features)
    ↓
AdminFeatureFlags Component
    ↓
useFeatureFlags() Hook
    ↓
featureFlagsService.updateFeatureFlag()
    ↓
Supabase UPDATE (feature_flags Table)
    ↓
Supabase Realtime Broadcast (INSERT/UPDATE/DELETE)
    ↓
useFeatureFlags() Hook (alle Clients!)
    ↓
UI Update (Feature erscheint/verschwindet)
```

---

## 🗄️ Datenbank-Schema

### `feature_flags` Tabelle

| Spalte | Typ | Beschreibung |
|--------|-----|--------------|
| `id` | TEXT | Primary Key (z.B. `file_browser`) |
| `name` | TEXT | Display Name (z.B. "Datei-Browser") |
| `description` | TEXT | Feature-Beschreibung |
| `enabled` | BOOLEAN | Feature global aktiviert? |
| `allowed_roles` | JSONB | Array: `["public", "user", "moderator", "admin"]` |
| `version` | TEXT | Seit welcher Version verfügbar (z.B. "2.2.0") |
| `category` | TEXT | Kategorie (core, chat, files, cloud, admin) |
| `created_at` | TIMESTAMPTZ | Erstellungs-Timestamp |
| `updated_at` | TIMESTAMPTZ | Letztes Update (Auto-Trigger) |
| `created_by` | UUID | FK → auth.users.id |
| `updated_by` | UUID | FK → auth.users.id |

### Setup SQL ausführen

```bash
# 1. SQL Script anzeigen
npm run db:show scripts/sql/feature_flags_setup.sql

# 2. Öffne Supabase SQL-Editor
# https://supabase.com/dashboard/project/YOUR_PROJECT/sql

# 3. Kopiere Script-Inhalt, klicke "Run" ✅
```

Das erstellt:
- ✅ `feature_flags` Tabelle
- ✅ Indexes (enabled, category, full-text search)
- ✅ `updated_at` Trigger
- ✅ RLS Policies (Admins = Write, Alle = Read)
- ✅ Helper Function `can_access_feature()`
- ✅ Realtime Publication
- ✅ 7 Default Features (dashboard, social_features, file_browser, etc.)

---

## 🎯 Aktuelle Features (v2.0)

| Feature ID | Name | Category | Enabled | Allowed Roles | Version |
|------------|------|----------|---------|---------------|---------|
| `dashboard` | Dashboard | core | ✅ | user, moderator, admin | 2.3.0 |
| `social_features` | Social-Funktionen | social | ✅ | user, moderator, admin | 2.3.0 |
| `chat_sidebar` | Chat-Seitenleiste | chat | ✅ | user, moderator, admin | 2.3.0 |
| `chat_sidebar_polish` | Chat-Sidebar Verbesserungen | chat | ✅ | public, user, moderator, admin | 2.1.0 |
| `file_upload_system` | Datei-Upload System | files | ✅ | user, moderator, admin | 2.1.0 |
| `file_browser` | Datei-Browser | files | ✅ | admin | 2.2.0 |
| `cloud_integration` | Cloud-Integration | cloud | ❌ | admin | 2.3.0 |

---

## 💻 Code-Beispiele

### 1. Feature in Component prüfen

```typescript
// MyComponent.tsx
import { useFeatureFlags } from '@/hooks/useFeatureFlags';

export default function MyComponent() {
  const { isFeatureEnabled, loading } = useFeatureFlags();

  if (loading) return <Spinner />;

  // Check if feature is enabled for current user
  if (!isFeatureEnabled('file_browser')) {
    return <NotFound />;
  }

  return <FileBrowser />;
}
```

### 2. Route mit Feature Flag schützen

```typescript
// main.tsx
import { FeatureFlagRoute } from '@/components/auth/FeatureFlagRoute';

{
  path: '/files',
  element: (
    <FeatureFlagRoute featureId="file_browser">
      <FileBrowserPage />
    </FeatureFlagRoute>
  )
}
```

### 3. Navigation mit Feature Flag

```typescript
// Header.tsx
import { useFeatureFlags } from '@/hooks/useFeatureFlags';

const navigationItems = [
  { path: '/dashboard', label: 'Dashboard', featureId: 'dashboard' },
  { path: '/social', label: 'Social', featureId: 'social_features' },
  { path: '/files', label: 'Dateien', featureId: 'file_browser' },
];

export default function Header() {
  const { isFeatureEnabled } = useFeatureFlags();

  const visibleNav = navigationItems.filter(item =>
    !item.featureId || isFeatureEnabled(item.featureId)
  );

  return <nav>{visibleNav.map(renderNavItem)}</nav>;
}
```

### 4. Admin Panel Usage

```typescript
// AdminFeatureFlags.tsx
import { useFeatureFlags } from '@/hooks/useFeatureFlags';

export default function AdminFeatureFlags() {
  const { features, toggleFeature, updateRoles, loading } = useFeatureFlags();

  const handleToggle = async (featureId: string) => {
    await toggleFeature(featureId);
    // Realtime Update → UI refreshes automatically!
  };

  const handleRolesUpdate = async (featureId: string, roles: string[]) => {
    await updateRoles(featureId, roles);
  };

  return (
    <div>
      {features.map(feature => (
        <FeatureCard
          key={feature.id}
          feature={feature}
          onToggle={() => handleToggle(feature.id)}
          onRolesUpdate={(roles) => handleRolesUpdate(feature.id, roles)}
        />
      ))}
    </div>
  );
}
```

### 5. Direkter Service-Zugriff

```typescript
// Ohne Hook (z.B. in Service-Layer)
import { getAllFeatureFlags, updateFeatureFlag } from '@/lib/services/featureFlags';

// Load all features
const { data: features, error } = await getAllFeatureFlags();

// Update a feature
const { data: updated, error } = await updateFeatureFlag('file_browser', {
  enabled: true,
  allowedRoles: ['user', 'moderator', 'admin']
});
```

---

## 🔐 Row-Level Security (RLS)

### Policy 1: Jeder kann Feature-Flags LESEN

```sql
CREATE POLICY "Anyone can read feature flags"
  ON public.feature_flags
  FOR SELECT
  USING (true);
```

**Warum?** Frontend braucht Zugriff um `canAccessFeature()` zu checken!

### Policy 2: Nur Admins können ÄNDERN

```sql
CREATE POLICY "Only admins can modify feature flags"
  ON public.feature_flags
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (
        auth.users.raw_user_meta_data->>'is_admin' = 'true'
        OR auth.users.email = current_setting('app.super_admin_email', true)
      )
    )
  );
```

**Schutz**: Nur Admins + Super Admin können Features togglen!

---

## 🔄 Realtime Updates

### Wie funktioniert's?

```typescript
// useFeatureFlags.ts
useEffect(() => {
  // Subscribe to Supabase Realtime
  const channel = supabase
    .channel('feature-flags-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'feature_flags'
      },
      (payload) => {
        console.log('Feature flag changed:', payload);
        // Reload features
        loadFeatures();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, []);
```

**Resultat**: Admin toggled Feature → **ALLE User sehen Update sofort!** (ohne Refresh)

---

## 🧪 Use Cases

### Use Case 1: Neues Feature sicher testen

```
1. Feature entwickeln auf develop
2. Merge zu main (Feature in DB: enabled=false)
3. Deploy zu Production
4. Admin-Panel: Toggle enabled=true, allowed_roles=["admin"]
5. Du testest in Production → funktioniert? ✓
6. Admin-Panel: allowed_roles=["user", "moderator", "admin"]
7. Fertig! Feature live für alle! 🎉
```

### Use Case 2: Feature schnell deaktivieren

```
Problem: File-Browser hat Bug in Production

Traditionell:
1. Hotfix entwickeln
2. Testen
3. Deploy
4. 30-60min Downtime

Mit Feature-Flag v2.0:
1. Admin-Panel öffnen (/admin/features)
2. file_browser → Toggle OFF
3. Feature sofort unsichtbar (Realtime!)
4. In Ruhe Hotfix entwickeln
5. Feature wieder aktivieren
✓ 10 Sekunden statt 60 Minuten!
```

### Use Case 3: Schrittweise Rollout

```
1. Feature entwickeln (Cloud-Integration)
2. Deploy (enabled=false)
3. Phase 1: allowed_roles=["admin"] (nur du)
4. Phase 2: allowed_roles=["admin", "moderator"] (+ Mods)
5. Phase 3: allowed_roles=["admin", "moderator", "user"] (+ Beta-User)
6. Phase 4: allowed_roles=["public", "user", "moderator", "admin"] (alle!)
```

---

## 📊 Admin Panel Features

### `/admin/features` Page

**Features:**
- ✅ Liste aller Feature-Flags
- ✅ Toggle enabled/disabled (1 Klick)
- ✅ Edit allowed_roles (Multi-Select)
- ✅ Edit name/description/version
- ✅ Category-Filter (core, chat, files, etc.)
- ✅ Search (name + description)
- ✅ Realtime Status Indicator
- ✅ Last Updated Info (wann + von wem)

**UI:**
```
┌─────────────────────────────────────────────────┐
│ Feature Flags Management              [🔄 Live] │
├─────────────────────────────────────────────────┤
│ [Search...] [Category: All ▼] [+ New Feature]  │
├─────────────────────────────────────────────────┤
│ 📁 file_browser                    [✅ Enabled] │
│    Datei-Browser mit Filter & Sortierung        │
│    Roles: 🔒 Admin Only                         │
│    v2.2.0 | files | Updated 2h ago by @rdegi    │
│    [Edit Roles] [Edit Details]                  │
├─────────────────────────────────────────────────┤
│ ☁️ cloud_integration               [❌ Disabled]│
│    Dropbox, Google Drive, OneDrive Integration  │
│    Roles: 🔒 Admin Only                         │
│    v2.3.0 | cloud | Updated 1d ago by @rdegi    │
│    [Enable] [Edit Roles] [Edit Details]         │
└─────────────────────────────────────────────────┘
```

---

## 🔧 Troubleshooting

### Issue: Feature ändert sich nicht

**Problem**: Feature-Toggle funktioniert nicht

**Lösung**:
1. Check Browser Console für Errors
2. Check Supabase SQL-Editor: `SELECT * FROM feature_flags WHERE id = 'YOUR_FEATURE';`
3. Check RLS Policies: Bist du Admin? (`SELECT is_admin(auth.uid());`)
4. Check Realtime: `ALTER PUBLICATION supabase_realtime ADD TABLE public.feature_flags;`

### Issue: "Permission denied"

**Problem**: RLS Policy blockiert Update

**Lösung**:
```sql
-- Check ob du Admin bist
SELECT
  raw_user_meta_data->>'is_admin' as is_admin,
  email
FROM auth.users
WHERE id = auth.uid();

-- Falls nicht: Admin machen
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(raw_user_meta_data, '{is_admin}', 'true')
WHERE id = 'YOUR_USER_ID';
```

### Issue: Realtime funktioniert nicht

**Problem**: Änderungen nicht live

**Lösung**:
```sql
-- Check ob Realtime enabled ist
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';

-- Falls feature_flags fehlt:
ALTER PUBLICATION supabase_realtime ADD TABLE public.feature_flags;
```

---

## 🎯 Migration von v1.0 → v2.0

### Was du tun musst:

1. **SQL Setup ausführen**: `npm run db:show scripts/sql/feature_flags_setup.sql`
2. **Code Migration**: Entferne alte `FEATURE_FLAGS` Konstante, nutze `useFeatureFlags()` Hook
3. **Admin Panel**: Gehe zu `/admin/features` und check alle Features

### Breaking Changes:

- ❌ `FEATURE_FLAGS` Konstante ist DEPRECATED (nutze Supabase statt in-memory)
- ❌ `adminOnly` Boolean → `allowed_roles` Array
- ❌ `betaAccess` Boolean → `allowed_roles` Array
- ✅ Alle alten Functions funktionieren via Legacy Adapter (Backward Compatibility!)

### Backward Compatibility:

```typescript
// OLD (v1.0) - FUNKTIONIERT NOCH!
import { FEATURE_FLAGS, canAccessFeature } from '@/lib/constants/featureFlags';

// NEW (v2.0) - EMPFOHLEN!
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
const { isFeatureEnabled } = useFeatureFlags();
```

---

## 📝 Changelog

### v2.0.0 (2025-10-28)
- ✅ Supabase Backend Integration
- ✅ Realtime Updates
- ✅ Role-Based Access (JSONB Array)
- ✅ Admin Panel (/admin/features)
- ✅ Audit Log (created_by, updated_by)
- ✅ Categories (core, chat, files, cloud, admin)
- ✅ Full-Text Search Index
- ✅ Helper Function `can_access_feature()`

### v1.0.0 (2025-10-19)
- ✅ In-Memory Feature Flags
- ✅ Basic adminOnly/betaAccess
- ✅ canAccessFeature() Helper

---

## 🚀 Nächste Schritte

**Für dich (jetzt):**
1. Öffne `/admin/features`
2. Check alle Feature-Status
3. Test: Toggle ein Feature → Check ob es sofort verschwindet!

**Für Entwicklung (später):**
1. A/B Testing: Verschiedene Features für verschiedene User-Gruppen
2. Scheduled Rollouts: Feature auto-enable zu bestimmter Zeit
3. Usage Analytics: Tracking welche Features genutzt werden
4. Feature Dependencies: Feature A benötigt Feature B

---

**Status**: ✅ **Production Ready** (v2.0.0)
**Maintainer**: DegixDAW Team
**Support**: Check `/admin/features` oder `scripts/sql/feature_flags_setup.sql`
