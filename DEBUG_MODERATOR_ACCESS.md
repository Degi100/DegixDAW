# Debug: Moderator 404 Problem

## 🔍 Schritt-für-Schritt Debugging

### **1. Browser Console öffnen (F12)**

Wenn rdegi sich einloggt und `/admin/issues` öffnet:

```javascript
// Im useAdmin Hook sollte folgendes ausgegeben werden:
console.log('[useAdmin] Debugging:', {
  user: user?.email,
  isSuperAdmin,
  isAdmin,
  isModerator,
  allowedRoutes,
  canAccessRoute: canAccessRoute('issues')
});
```

### **2. Expected Output für rdegi (Moderator):**

```javascript
{
  user: "rdegi@example.com",
  isSuperAdmin: false,
  isAdmin: false,        // ← Moderator ist KEIN Admin!
  isModerator: true,
  allowedRoutes: [],     // ← Wahrscheinlich LEER (weil user_metadata nicht gesetzt)
  canAccessRoute: true   // ← Sollte TRUE sein (wegen Default-Route)
}
```

### **3. Das Problem:**

**Wenn `canAccessRoute('issues') === false` dann ist es einer dieser Bugs:**

#### **Bug A: `user_metadata` wird nicht geladen**
```sql
-- Check in Supabase Dashboard → SQL Editor:
SELECT
  email,
  raw_user_meta_data
FROM auth.users
WHERE email = 'rdegi@example.com';

-- Expected:
-- raw_user_meta_data: {"is_moderator": true, ...}
```

#### **Bug B: `is_moderator` ist nicht in `user_metadata`**
```javascript
// In useAuth Hook sollte sein:
user.user_metadata.is_moderator === true
```

#### **Bug C: `DEFAULT_ROUTES_BY_ROLE` wird nicht geprüft**
```typescript
// In useAdmin.ts:57-66
// Zeile 73-75 sollte MATCH geben für Moderatoren
if (isModerator && DEFAULT_ROUTES_BY_ROLE.moderator.includes(routeId)) {
  return true; // ← Wird das erreicht?
}
```

---

## 🔧 **Quick Fix: Console Logging hinzufügen**

Ich füge jetzt Debug-Logs ein, dann siehst du GENAU wo es hängt!
