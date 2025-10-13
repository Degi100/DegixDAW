# 🎛️ Feature-Flags System

## Übersicht

Das **Feature-Flags System** ermöglicht es, Features in Production **schrittweise** freizuschalten - **ohne neuen Deploy**! Du als Admin kannst Features:
- ✅ Aktivieren/Deaktivieren
- 🔒 Nur für dich sichtbar machen (Testen in Production)
- 🧪 Für Beta-Tester freigeben
- 🌍 Für alle User veröffentlichen

---

## 🚀 Workflow

### **Traditionell (Alt):**
```
develop → testen → main deploy → ALLE sehen Feature
                                ↓
                          Problem? → Hotfix → neuer Deploy
```

### **Mit Feature-Flags (Neu):**
```
develop → main deploy (Feature disabled)
                ↓
         Admin aktiviert Feature (nur für sich)
                ↓
         Testen in Production ✓
                ↓
         Feature für alle aktivieren (1 Klick!)
                ↓
         Problem? → Feature deaktivieren (1 Klick!)
```

---

## 📁 Dateistruktur

```
src/
├── lib/
│   └── constants/
│       └── featureFlags.ts          # Feature-Definitions
├── components/
│   ├── admin/
│   │   └── AdminFeatureFlags.tsx    # Admin Toggle-Panel
│   └── layout/
│       └── Header.tsx                # Navigation mit Flag-Check
└── styles/
    └── components/
        └── admin/
            └── _feature-flags.scss   # Panel-Styling
```

---

## 🎯 Wie funktioniert's?

### 1. Feature definieren

```typescript
// src/lib/constants/featureFlags.ts

export const FEATURE_FLAGS = {
  FILE_BROWSER: {
    id: 'file_browser',
    name: 'Datei-Browser',
    description: 'Übersicht aller hochgeladenen Dateien',
    enabled: true,        // Feature ist aktiv
    adminOnly: true,      // 🔒 Nur du siehst es!
    betaAccess: false,
    version: '2.2.0',
  },
};
```

### 2. Feature in Code schützen

```typescript
// src/components/layout/Header.tsx

const navigationItems = [
  { 
    path: '/files', 
    label: 'Dateien', 
    icon: '📂',
    featureFlag: 'FILE_BROWSER'  // ← Zugriffskontrolle
  },
];

// Automatische Filterung:
const filteredNavItems = navigationItems.filter(item => {
  if (item.featureFlag) {
    return canAccessFeature(item.featureFlag, isAdmin);
  }
  return true;
});
```

### 3. Admin-Panel nutzen

**Zugriff**: `/admin/settings` → Tab "Feature-Flags"

**Optionen**:
- **✅ Aktiviert / ❌ Deaktiviert**: Feature komplett ein/aus
- **🌍 Öffentlich**: Alle sehen es
- **🧪 Beta-Tester**: Nur Beta-User
- **🔒 Nur Admins**: Nur du (zum Testen)

---

## 🔧 Use Cases

### **Use Case 1: Neues Feature sicher testen**

```
1. Feature entwickeln auf develop
2. Merge zu main (Feature enabled: false)
3. Deploy zu Production
4. Admin-Panel: Feature aktivieren (adminOnly: true)
5. Du testest in Production → funktioniert? ✓
6. Admin-Panel: adminOnly → false (alle sehen es)
7. Fertig! Kein erneuter Deploy nötig
```

### **Use Case 2: Feature schnell deaktivieren**

```
Problem: File-Browser hat Bug in Production

Traditionell:
1. Hotfix entwickeln
2. Testen
3. Deploy
4. 30-60min Downtime

Mit Feature-Flag:
1. Admin-Panel öffnen
2. FILE_BROWSER → deaktivieren
3. Feature sofort unsichtbar
4. In Ruhe Hotfix entwickeln
5. Feature wieder aktivieren
✓ 10 Sekunden statt 60 Minuten!
```

### **Use Case 3: Beta-Testing**

```
1. Feature entwickeln (Cloud-Integration)
2. Aktivieren für Beta-Tester (betaAccess: true)
3. Feedback sammeln
4. Verbesserungen umsetzen
5. Für alle freischalten
```

---

## 🎨 Feature-Status Icons

| Icon | Bedeutung | Wer sieht es? |
|------|-----------|---------------|
| ✅ | Öffentlich | Alle User |
| 🧪 | Beta | Beta-Tester + Admins |
| 🔒 | Admin-Only | Nur du |
| ❌ | Deaktiviert | Niemand |

---

## 💻 Code-Beispiele

### **Komponente mit Feature-Flag schützen**

```typescript
// FileBrowserPage.tsx
import { canAccessFeature } from '../../lib/constants/featureFlags';
import { useAdmin } from '../../hooks/useAdmin';

export default function FileBrowserPage() {
  const { isAdmin } = useAdmin();
  
  // Zugriffskontrolle
  if (!canAccessFeature('FILE_BROWSER', isAdmin)) {
    return <NotFound />;
  }
  
  return <FileBrowser />;
}
```

### **Feature in Hook verwenden**

```typescript
// useFeatures.ts
import { canAccessFeature } from '../lib/constants/featureFlags';
import { useAdmin } from './useAdmin';

export function useFeatures() {
  const { isAdmin } = useAdmin();
  
  return {
    hasFileBrowser: canAccessFeature('FILE_BROWSER', isAdmin),
    hasCloudSync: canAccessFeature('CLOUD_INTEGRATION', isAdmin),
  };
}
```

### **Conditional Rendering**

```typescript
// Dashboard.tsx
const { hasFileBrowser } = useFeatures();

return (
  <div>
    <h1>Dashboard</h1>
    
    {hasFileBrowser && (
      <FileBrowserWidget />
    )}
  </div>
);
```

---

## 🗄️ Persistierung (TODO)

**Aktuell**: Feature-Flags sind in-memory (neu laden = reset)

**Geplant**: Supabase-Persistierung

```sql
-- Tabelle erstellen
CREATE TABLE feature_flags (
  id TEXT PRIMARY KEY,
  enabled BOOLEAN NOT NULL DEFAULT false,
  admin_only BOOLEAN NOT NULL DEFAULT true,
  beta_access BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Policies
CREATE POLICY "Admins can manage flags"
ON feature_flags FOR ALL
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Everyone can read flags"
ON feature_flags FOR SELECT
TO authenticated
USING (true);
```

**Code-Update** (für später):

```typescript
// Load from Supabase
const { data } = await supabase
  .from('feature_flags')
  .select('*');

// Update state
data.forEach(flag => {
  FEATURE_FLAGS[flag.id].enabled = flag.enabled;
  FEATURE_FLAGS[flag.id].adminOnly = flag.admin_only;
});
```

---

## 🧪 Testing

### **Test 1: Admin sieht Feature**
```typescript
test('Admin can access admin-only feature', () => {
  const result = canAccessFeature('FILE_BROWSER', true);
  expect(result).toBe(true);
});
```

### **Test 2: User sieht Feature nicht**
```typescript
test('Regular user cannot access admin-only feature', () => {
  const result = canAccessFeature('FILE_BROWSER', false);
  expect(result).toBe(false);
});
```

### **Test 3: Disabled Feature**
```typescript
test('Nobody can access disabled feature', () => {
  FEATURE_FLAGS.CLOUD_INTEGRATION.enabled = false;
  
  expect(canAccessFeature('CLOUD_INTEGRATION', true)).toBe(false);
  expect(canAccessFeature('CLOUD_INTEGRATION', false)).toBe(false);
});
```

---

## 🚀 Deployment-Workflow

### **Strategie: Alle Features zu main, schrittweise aktivieren**

```bash
# develop Branch: Alle Features entwickelt
git checkout develop

# Merge zu main (alles geht live, aber versteckt!)
git checkout main
git merge develop
git tag v2.1.0
git push origin main --tags

# Deploy erfolgt...
# JETZT: Features sind deployed, aber disabled/admin-only!
```

**Admin-Panel Workflow**:

1. **v2.1.0 Deploy** (7. Oktober)
   - Chat-Sidebar: ✅ Öffentlich
   - File-Upload: ✅ Öffentlich
   - File-Browser: 🔒 Admin-Only

2. **Feature-Test** (7-8. Oktober)
   - Du testest File-Browser in Production
   - Bugs gefunden? → Hotfix-Branch
   - Alles gut? → Aktivieren!

3. **Feature-Release** (9. Oktober)
   - Admin-Panel: FILE_BROWSER → Öffentlich
   - 📢 Announcement: "New file browser available!"

4. **v2.2.0 Deploy** (14. Oktober)
   - Cloud-Integration: 🔒 Admin-Only
   - Repeat workflow...

---

## 📊 Vorteile

| Vorteil | Beschreibung |
|---------|-------------|
| **Sicheres Testen** | Features in Production testen ohne User-Impact |
| **Schnelles Rollback** | Feature deaktivieren in 10 Sekunden |
| **Schrittweise Releases** | Features einzeln aktivieren, nicht alles auf einmal |
| **Beta-Testing** | Ausgewählte User einbinden |
| **Keine Re-Deploys** | Feature-Aktivierung ohne Code-Deploy |
| **A/B Testing** | Verschiedene Features für verschiedene User-Gruppen |

---

## ⚠️ Best Practices

### **DO's** ✅
- Features immer mit Flag starten (adminOnly: true)
- Flags nach Release für 1-2 Wochen behalten (Rollback-Option)
- Flags in Code kommentieren (warum? seit wann?)
- Feature-Status dokumentieren

### **DON'Ts** ❌
- Flags nicht zu lange behalten (Code-Bloat)
- Nicht zu viele Flags gleichzeitig (max 5-10)
- Flags nicht für kritische Auth/Security-Features

---

## 🔄 Feature-Lifecycle

```
1. Development
   ├─ Feature entwickeln
   └─ Flag erstellen (enabled: false)

2. Staging
   ├─ Auf develop testen
   └─ Flag: adminOnly: true

3. Production (Silent Deploy)
   ├─ Merge zu main
   ├─ Deploy
   └─ Feature unsichtbar

4. Internal Testing
   ├─ Admin aktiviert Flag
   ├─ Testing in Production
   └─ Bugs fixen

5. Beta Release
   ├─ betaAccess: true
   └─ Feedback sammeln

6. Public Release
   ├─ adminOnly: false
   └─ Announcement

7. Cleanup (nach 2 Wochen)
   ├─ Flag entfernen
   └─ Feature "permanent"
```

---

## 📝 Aktuelle Features

| Feature | Status | Version | Zugänglich für |
|---------|--------|---------|----------------|
| Chat-Sidebar Polish | ✅ Live | v2.1.0 | Alle |
| File-Upload System | ✅ Live | v2.1.0 | Alle |
| File-Browser | 🔒 Admin | v2.2.0 | Nur du |
| Cloud-Integration | ❌ Disabled | v2.3.0 | Niemand |

---

## 🎯 Nächste Schritte

1. **Jetzt**: Auf main deployen (alle Features, flags gesetzt)
2. **Testing**: File-Browser in Production testen
3. **Release**: File-Browser öffentlich machen (1 Klick)
4. **Develop**: Cloud-Integration entwickeln (parallel!)
5. **Repeat**: Gleicher Workflow für Cloud-Features

---

**Status**: ✅ Production Ready  
**Version**: 1.0.0  
**Maintainer**: DegixDAW Team
