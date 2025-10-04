# 🔍 Social Feature Debug Guide

## Test-Checkliste

### 1. **Benutzersuche testen**

**Öffne Browser Console auf `/social` Seite:**

```javascript
// Test 1: Prüfe ob Supabase Client verfügbar ist
console.log('Supabase:', window.supabase || 'Nicht global verfügbar');

// Test 2: Manuelle Suche ausführen
import { supabase } from './lib/supabase';

const testSearch = async () => {
  try {
    // Alle Profile abrufen
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, username, avatar_url, email, role, created_at')
      .limit(10);
    
    console.log('✅ Profile gefunden:', data);
    console.log('❌ Fehler:', error);
    
    return { data, error };
  } catch (err) {
    console.error('💥 Exception:', err);
  }
};

testSearch();
```

### 2. **Was zu prüfen ist:**

#### ✅ Erfolg-Indikatoren:
- [ ] Suchfeld wird angezeigt
- [ ] Mindestens 2 Zeichen eingeben triggert Suche
- [ ] Loading-Spinner erscheint während der Suche
- [ ] Benutzer-Karten werden angezeigt
- [ ] Avatar/Initialen werden korrekt dargestellt
- [ ] Username wird mit `@` angezeigt
- [ ] Buttons (Friend Request, Follow) werden angezeigt

#### ❌ Fehler-Szenarien:

**1. "Keine Benutzer gefunden" obwohl welche existieren:**
```sql
-- In Supabase SQL Editor prüfen:
SELECT id, full_name, username, email, role 
FROM public.profiles 
LIMIT 10;
```

**2. RLS Policy blockiert Zugriff:**
```sql
-- In Supabase SQL Editor:
-- Prüfe ob RLS aktiv ist
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'profiles';

-- Zeige alle Policies
SELECT * FROM pg_policies WHERE tablename = 'profiles';
```

**3. Spalten fehlen (email, role):**
```sql
-- Prüfe Tabellen-Schema
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'profiles';
```

### 3. **Freundschafts-Anfragen testen**

```javascript
// In Browser Console
const testFriendRequest = async (friendId) => {
  const { data: { user } } = await supabase.auth.getUser();
  console.log('Aktueller User:', user?.id);
  
  const { data, error } = await supabase
    .from('friendships')
    .insert({
      user_id: user?.id,
      friend_id: friendId,
      status: 'pending'
    })
    .select();
  
  console.log('Freundschaftsanfrage:', { data, error });
};
```

### 4. **Follower-System testen**

```javascript
// In Browser Console
const testFollow = async (targetUserId) => {
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data, error } = await supabase
    .from('followers')
    .insert({
      follower_id: user?.id,
      following_id: targetUserId
    })
    .select();
  
  console.log('Follow:', { data, error });
};
```

## 🐛 Bekannte Probleme & Lösungen

### Problem: "column avatar_url does not exist"
**Status:** ✅ BEHOBEN
**Was wurde gemacht:**
- Entfernt aus allen TypeScript Interfaces
- Entfernt aus allen Supabase Queries
- UserCard zeigt jetzt immer Initialen (z.B. "JD" für "John Doe")

### Problem: "column email does not exist in profiles"
**Status:** ✅ BEHOBEN
**Was wurde gemacht:**
- Email nur in `auth.users` Tabelle, nicht in `profiles`
- Entfernt aus Suche-Query
- Suche funktioniert nur mit `full_name` und `username`

### Problem: "column role does not exist"
**Status:** ✅ BEHOBEN
**Was wurde gemacht:**
- Entfernt aus TypeScript Interface
- Entfernt aus Query
- UserCard zeigt keine Rolle mehr an

### ✅ AKTUELLES PROFILES SCHEMA:
```sql
-- Nur diese Spalten werden jetzt verwendet:
SELECT id, full_name, username, created_at 
FROM public.profiles;
```

### Problem: "profiles Tabelle nicht gefunden"
**Lösung:** Profiles Tabelle muss existieren (normalerweise automatisch von Supabase Auth erstellt)

### Problem: "permission denied for table profiles"
**Lösung:** RLS Policy für profiles hinzufügen:
```sql
-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to view all profiles
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles
  FOR SELECT
  USING (true);
```

### Problem: "email spalte nicht gefunden"
**Lösung:** Email ist in `auth.users`, nicht in `profiles`. Query anpassen:
```typescript
// Hook ändern zu:
.select('id, full_name, username, avatar_url, role, created_at')
// OHNE email
```

## 📝 Schnelltest-Script

Kopiere das in die Browser Console auf `/social`:

```javascript
const quickTest = async () => {
  console.log('🚀 Starting Social Feature Test...\n');
  
  // 1. Auth Status
  const { data: { user } } = await supabase.auth.getUser();
  console.log('1️⃣ Auth User:', user?.id ? '✅ Eingeloggt' : '❌ Nicht eingeloggt');
  
  // 2. Profile abrufen
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('count')
    .limit(1);
  console.log('2️⃣ Profiles Tabelle:', profilesError ? `❌ ${profilesError.message}` : '✅ Erreichbar');
  
  // 3. Friendships Tabelle
  const { error: friendshipsError } = await supabase
    .from('friendships')
    .select('count')
    .limit(1);
  console.log('3️⃣ Friendships Tabelle:', friendshipsError ? `❌ ${friendshipsError.message}` : '✅ Erreichbar');
  
  // 4. Followers Tabelle
  const { error: followersError } = await supabase
    .from('followers')
    .select('count')
    .limit(1);
  console.log('4️⃣ Followers Tabelle:', followersError ? `❌ ${followersError.message}` : '✅ Erreichbar');
  
  console.log('\n✨ Test abgeschlossen!');
};

quickTest();
```

## 🎯 Nächste Schritte

1. **Öffne die App:** `http://localhost:5173/social`
2. **Öffne Browser Console:** F12 oder Rechtsklick → Inspect
3. **Führe Schnelltest aus:** Kopiere `quickTest()` Code
4. **Teste Suche manuell:** Tippe einen Namen in das Suchfeld
5. **Prüfe Console:** Schaue nach Fehlern (rot markiert)

