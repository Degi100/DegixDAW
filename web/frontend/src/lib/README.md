# 📚 Library Utilities (`src/lib/`)

Dieses Verzeichnis enthält wiederverwendbare Utilities und Services für das Projekt.

## Übersicht der Module

- **`auth/`**: Authentifizierungsbezogene Hilfsfunktionen (z. B. Onboarding-Checks).
- **`authUtils.ts`**: Allgemeine Auth-Utility-Funktionen wie Fehlerbehandlung.
- **`constants/`**: Projektweite Konstanten und Konfigurationen.
- **`profile/`**: Profilbezogene Hilfsfunktionen.
- **`supabase.ts`**: Supabase-Client-Setup und Datenbank-Utility-Funktionen.
- **`urlUtils.ts`**: URL-Generierung für Auth-Callbacks und Recovery.
- **`usernameGenerator.ts`**: Generator für zufällige Benutzernamen.
- **`validation/`**: Validierungsschemas und -funktionen (mit Zod).

## Verwendung
- Importiere Funktionen direkt: `import { supabase } from '../lib/supabase';`
- Für Validierungen: `import { signInSchema } from '../lib/validation';`

## Sicherheitshinweise
- Geheimnisse werden ausschließlich aus Umgebungsvariablen (`import.meta.env`) geladen – keine hartcodierten Werte.
