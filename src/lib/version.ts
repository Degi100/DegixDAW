// src/lib/version.ts
// Version Management - Centralized Version Information

import { APP_CONFIG } from './constants';

export interface VersionInfo {
  version: string;
  date: string;
  type: 'major' | 'minor' | 'patch';
  changes: {
    added?: string[];
    fixed?: string[];
    changed?: string[];
    removed?: string[];
    deprecated?: string[];
    security?: string[];
  };
}

export const VERSION_HISTORY: VersionInfo[] = [
  {
    version: "0.1.3",
    date: "2025-10-08",
    type: "patch",
    changes: {
      added: [
        "Feature-Flags System - Supabase Backend mit Realtime-Updates und Multi-Role Support",
        "Admin Feature-Management UI - Vollständige Verwaltung unter /admin/features",
        "Chat Badge-System - Ungelesen-Anzeige mit Auto-Mark-as-Read",
        "File-Upload & File-Browser - Datei-Management in Chat integriert"
      ],
      fixed: [
        "TypeScript Test-Fehler - isExistingConversation Property behoben",
        "Chat-Sidebar Performance - Hook-Refactoring, Scroll-Optimierung",
        "Feature-Flag Navigation-Bug - Korrekte Feature-Ladung",
        "Realtime Message-Sync - Keine doppelten Subscriptions mehr"
      ],
      changed: [
        "CLAUDE.md Dokumentation aktualisiert - Feature-Flags, Git Workflow",
        "Chat-Architektur - Extraction in Custom Hooks (useConversationMessages, useChatCoordination)",
        ".gitignore erweitert - CLAUDE.md als private Projektdokumentation"
      ]
    }
  },
  {
    version: "0.1.2",
    date: "2025-10-05",
    type: "patch",
    changes: {
      fixed: [
        "Issue Management System - Verbesserte Issue-Verfolgung und -Verwaltung",
        "Chat UI Verbesserungen - Bessere Darstellung von Chat-Nachrichten",
        "Datenbank-Konsistenz - Kritische Fixes für user_id → id Spaltenkonflikte",
        "406 Not Acceptable Fehler behoben",
        "403 Forbidden Fehler bei Profil-Erstellung behoben",
        "RLS Policy Verletzungen behoben"
      ],
      changed: [
        "Verbesserte TypeScript-Konfiguration für bessere Entwicklungserfahrung"
      ]
    }
  },
  {
    version: "0.1.1",
    date: "2025-10-04",
    type: "minor",
    changes: {
      added: [
        "Erweiterte Authentifizierung - Verbesserte Benutzerauthentifizierung",
        "Social Features - Erste Version der sozialen Funktionen",
        "Chat-System - Grundlegende Chat-Funktionalität",
        "Profil-Management - Vollständiges Profil-System"
      ],
      fixed: [
        "TypeScript exactOptionalPropertyTypes Fehler behoben",
        "Bundle-Splitting Optimierungen",
        "Supabase-Sicherheit durch Entfernung hartkodierter API-Keys"
      ]
    }
  },
  {
    version: "0.1.0",
    date: "2025-10-01",
    type: "minor",
    changes: {
      added: [
        "Issue Management MVP - Grundlegendes Issue-Management-System",
        "Projekt-Grundgerüst - Initiale Projektstruktur",
        "Entwicklungsumgebung - npm run app Kommando für Dev-Server"
      ]
    }
  }
];

export const CURRENT_VERSION = APP_CONFIG.version;

export const getVersionInfo = (version?: string): VersionInfo | undefined => {
  return VERSION_HISTORY.find(v => v.version === version);
};

export const getLatestVersions = (count: number = 5): VersionInfo[] => {
  return VERSION_HISTORY.slice(0, count);
};

export const formatVersionForDisplay = (version: string): string => {
  const versionInfo = getVersionInfo(version);
  const typeLabel = {
    major: '🏗️ Major',
    minor: '✨ Minor',
    patch: '🔧 Patch'
  }[versionInfo?.type || 'patch'];

  return `${typeLabel} ${version}`;
};
