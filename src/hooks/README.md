# 🪝 Custom Hooks (`src/hooks/`)

Dieses Verzeichnis enthält wiederverwendbare React-Hooks für State-Management und Daten-Fetching.

## Übersicht der Hooks

- **`useAuth.ts`**: Haupt-Authentifizierungs-Hook mit Login, Signup, OAuth und Session-Management.
- **`useAuthCallback.ts`**: Behandelt OAuth-Callbacks und Token-Verarbeitung.
- **`useConversations.ts`**: Verwalte Chat-Konversationen und Nachrichten.
- **`useMessages.ts`**: Hook für Nachrichten-Senden und -Empfangen.
- **`useFollowers.ts`**: Follower- und Following-Logik.
- **`useFriends.ts`**: Freundeslisten und -Interaktionen.
- **`useIssues.ts`**: Issue-Tracking und -Aktionen.
- **`useUserData.ts`**: Benutzerprofil-Daten und -Updates.
- **`useTheme.ts`**: Theme-Switching (z. B. Dark/Light Mode).
- **`useToast.ts`**: Toast-Benachrichtigungen.
- **Weitere**: `useForm.ts`, `useBulkOperations.ts`, etc. für spezifische Features.

## Verwendung
- Hooks sind stateful und sollten in funktionalen Komponenten verwendet werden.
- Beispiel: `const { user, signIn } = useAuth();`

## Best Practices
- Hooks sind idempotent und behandeln Fehler intern.
- Verwende `useCallback` und `useMemo` in Komponenten, um unnötige Re-renders zu vermeiden.
