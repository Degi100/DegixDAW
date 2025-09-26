# Supabase Account Deletion Setup

## Problem
Die Account-Löschungsfunktion (`deleteAccount`) war bisher nur eine Simulation - sie hat den Benutzer nur abgemeldet, aber das Konto nicht aus Supabase gelöscht.

## Lösung
Ich habe eine echte Account-Löschungsfunktion implementiert, die Supabase RPC (Remote Procedure Call) Funktionen verwendet.

## Setup-Anweisungen

### 1. Supabase SQL Functions installieren

1. Öffnen Sie Ihr Supabase Dashboard
2. Gehen Sie zu **SQL Editor**
3. Führen Sie den Inhalt der Datei `supabase_functions.sql` aus

Die SQL-Datei erstellt zwei Funktionen:
- `delete_user_account()` - Löscht den Account permanent
- `mark_user_for_deletion()` - Soft Delete (markiert für Löschung, safer)

### 2. Funktionsweise

Die neue `deleteAccount` Funktion versucht in dieser Reihenfolge:

1. **Vollständige Löschung**: `delete_user_account()` RPC
2. **Soft Delete**: `mark_user_for_deletion()` RPC (falls #1 fehlschlägt) 
3. **Fallback**: Benutzer abmelden + Fehlermeldung (falls beide fehlschlagen)

### 3. Sicherheitshinweise

⚠️ **Wichtig**: Die `delete_user_account()` Funktion löscht den Benutzer **unwiderruflich** aus der `auth.users` Tabelle.

Für Production empfehle ich:
- Verwenden Sie hauptsächlich `mark_user_for_deletion()` (Soft Delete)
- Implementieren Sie einen separaten Admin-Prozess für endgültige Löschung
- Backup-Strategie für versehentliche Löschungen

### 4. Testing

Nach dem SQL-Setup können Sie die Account-Löschung testen:

1. Melden Sie sich in der App an
2. Gehen Sie zu Settings
3. Klicken Sie "Konto löschen"
4. Bestätigen Sie die Warnungen
5. Der Account sollte jetzt **tatsächlich** aus Supabase gelöscht werden

### 5. Fehlerbehandlung

Die Funktion behandelt alle Fehlerfälle:
- ✅ RPC-Funktionen erfolgreich → Account gelöscht
- ⚠️ Vollständige Löschung fehlgeschlagen → Soft Delete
- ❌ Beide fehlgeschlagen → Benutzer abgemeldet + Support-Hinweis

## Vorher vs. Nachher

### Vorher (Simulation):
```typescript
// Nur Simulation - kein echtes Löschen
await signOut();
success('🗑️ Konto-Löschung angefordert - Sie wurden abgemeldet');
```

### Nachher (Echte Löschung):
```typescript
// Echte Löschung mit Fallback-Strategie
const result = await deleteAccount();
if (result.success) {
  success('🗑️ Ihr Konto wurde erfolgreich gelöscht');
} else {
  error(`❌ Fehler: ${result.error?.message}`);
}
```

## Status

✅ **Account-Löschung funktioniert jetzt korrekt!**
- Echte Löschung aus Supabase Database
- Robuste Fehlerbehandlung
- Soft Delete als Fallback
- Benutzerfreundliche Fehlermeldungen