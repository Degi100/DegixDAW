# Admin Role System Setup

Dieses SQL-Script richtet das vollständige Admin-Role-Management-System ein.

## Features

✅ **Role-System**
- `user` (Standard) - Normale Benutzer
- `moderator` - Moderatoren mit erweiterten Rechten
- `admin` - Administratoren mit vollen Rechten

✅ **Super Admin Protection**
- Super Admin (via `VITE_SUPER_ADMIN_EMAIL`) kann nicht gelöscht werden
- Role kann nicht geändert werden
- Automatischer Schutz via Database Trigger

✅ **RLS Policies**
- Nur Admins können Roles ändern
- Super Admin ist vor Änderungen geschützt
- Automatische Synchronisation zu `auth.users.raw_user_meta_data`

✅ **Realtime Sync**
- Role-Änderungen werden automatisch in `user_metadata` gespiegelt
- `is_admin` und `is_moderator` Flags werden gesetzt
- Frontend erhält Updates via Supabase Auth

## Installation

### 1. Supabase SQL Editor öffnen
Gehe zu: `https://supabase.com/dashboard/project/YOUR_PROJECT/sql`

### 2. Script ausführen
```sql
-- Kopiere und füge den Inhalt von admin_role_system_setup.sql ein
-- Klicke auf "Run"
```

### 3. Super Admin Email setzen (wichtig!)
```sql
-- Setze deine Super Admin Email als App-Setting
ALTER DATABASE postgres SET app.super_admin_email = 'deine-email@example.com';
```

### 4. Verifizierung
```sql
-- Prüfe, ob role-Spalte existiert
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'profiles' AND column_name = 'role';

-- Prüfe bestehende Roles
SELECT role, COUNT(*) as count
FROM profiles
GROUP BY role;

-- Teste RPC Function (als Admin)
SELECT * FROM get_all_users_with_metadata();
```

## Verwendung im Frontend

### Role-Änderung
```typescript
import { useUserData } from '@/hooks/useUserData';

const { updateUser } = useUserData();

// User Role ändern
await updateUser({
  ...user,
  role: 'moderator' // oder 'admin', 'user'
});
```

### Super Admin Check
```typescript
import { useAdmin } from '@/hooks/useAdmin';

const { isSuperAdmin, isAdmin, isModerator } = useAdmin();

if (isSuperAdmin) {
  // Zeige Super Admin Features
}
```

### Protected UI
- **UserEditModal** - Role-Dropdown disabled für Super Admin
- **UserDeleteModal** - Delete-Button hidden für Super Admin
- **UserTableRow** - Edit/Delete Buttons disabled + "🛡️ Protected" Badge

## Sicherheits-Features

### Database Level
1. **RLS Policy** - Nur Admins können Roles ändern
2. **Trigger** - Verhindert Super Admin Role-Änderungen
3. **Function Security** - `SECURITY DEFINER` für sichere Ausführung

### Frontend Level
1. **UI Disabled States** - Buttons für Super Admin disabled
2. **Visual Indicators** - 🛡️ Badge zeigt geschützte Accounts
3. **Modal Protection** - Super Admin kann nicht deleted werden

### Backend Level
1. **user_metadata Sync** - Role wird in Auth-Metadata gespiegelt
2. **Realtime Updates** - Änderungen werden sofort propagiert
3. **Admin Check** - RPC Function prüft Admin-Berechtigung

## Troubleshooting

### "Access denied: Admin role required"
```sql
-- Prüfe, ob dein User Admin ist
SELECT id, email, role
FROM profiles
WHERE email = 'deine-email@example.com';

-- Falls nicht Admin, setze manuell:
UPDATE profiles
SET role = 'admin'
WHERE email = 'deine-email@example.com';
```

### "Super admin email not set"
```sql
-- Setze App-Setting
ALTER DATABASE postgres SET app.super_admin_email = 'deine-email@example.com';

-- Prüfe Setting
SHOW app.super_admin_email;
```

### Role-Änderungen werden nicht übernommen
```sql
-- Prüfe Trigger
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers
WHERE trigger_name = 'sync_role_metadata_trigger';

-- Falls Trigger fehlt, re-run Setup-Script
```

## Migration von altem System

Falls du bereits ein User-System hast:

```sql
-- Backup erstellen
CREATE TABLE profiles_backup AS SELECT * FROM profiles;

-- Alle User auf 'user' setzen
UPDATE profiles SET role = 'user' WHERE role IS NULL;

-- Deine Admin-Email als Admin setzen
UPDATE profiles SET role = 'admin' WHERE email = 'deine-email@example.com';

-- Verifizieren
SELECT role, COUNT(*) FROM profiles GROUP BY role;
```

## Nächste Schritte

Nach erfolgreicher Installation:
1. ✅ Teste Admin-Panel unter `/admin/users`
2. ✅ Prüfe Role-Dropdown in Edit-Modal
3. ✅ Teste Super Admin Protection
4. ✅ Verifiziere `user_metadata` Sync in Supabase Auth Dashboard
5. ✅ Teste Realtime-Updates (Role ändern, Frontend sollte Update sehen)
