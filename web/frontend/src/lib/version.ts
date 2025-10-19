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
    version: "0.1.5",
    date: "2025-10-19",
    type: "patch",
    changes: {
      added: [
        "Project Collaborators System - Invite users with granular permissions (Viewer/Contributor/Mixer/Admin)",
        "Track Comments with Timestamps - Add comments to specific track positions with resolve status",
        "BPM Detection - Automatic BPM detection for audio tracks using web-audio-beat-detector",
        "Pan Control - Audio panning control (-1.0 Left to 1.0 Right) with visual slider",
        "Pending Invites Dashboard - Accept/Reject project invitations from Dashboard",
        "Auto-add Project Owner - Creator automatically added as ADMIN collaborator"
      ],
      fixed: [
        "Unknown User Display - Profile mapping for collaborators and track comments",
        "Supabase .in() Query Bug - Single-element arrays now use .eq() instead of .in()",
        "avatar_url Column Error - Removed non-existent avatar_url from profiles queries",
        "New Comments Missing Username - Fetch profile after creating comment",
        "Project Owner Not Listed - Auto-insert creator into project_collaborators table",
        "RLS Policy Infinite Recursion - Simplified collaborator read policies"
      ],
      changed: [
        "Collaborators Display - Color-coded role badges (ADMIN=red, MIXER=purple, CONTRIBUTOR=blue, VIEWER=gray)",
        "Profile Queries - Use .eq() for single user, .in() for multiple users",
        "Comment Creation Flow - Return username with newly created comments"
      ]
    }
  },
  {
    version: "0.1.4",
    date: "2025-10-18",
    type: "patch",
    changes: {
      added: [
        "SendFileModal Deluxe Edition - Komplettes Redesign mit FileBrowser Design System",
        "Friend-only File Sharing - Dateien nur an akzeptierte Freunde schicken",
        "FileBrowser Mobile Optimization - Card-basierte Tabellen-Ansicht für Mobile",
        "FileBrowser Dashboard Integration - Einheitliches Layout mit Dashboard-Cards",
        "Multi-Select File Delete - Checkbox-basiertes Löschen mit 'Alles auswählen'",
        "Soft Delete System - WhatsApp-Style 'Für mich löschen' mit RLS Policies",
        "Vercel Deployment Support - Dynamische URL-Erkennung für Multi-Platform",
        "Project Analytics Dashboard - Real-time Stats & Growth Metrics mit Recharts",
        "Analytics Export - CSV/JSON Export + Custom Milestones",
        "Daily Analytics Snapshots - GitHub Actions + Automated Data Collection",
        "Issues System - Complete Ticket Management mit Comments, Labels, Assignment",
        "Desktop App (C++) - Windows Native App mit Supabase Integration",
        "Music Project Database Schema - Projects, Tracks, MIDI Events, Mixdowns, Presets"
      ],
      fixed: [
        "SendFileModal z-index - Modal bleibt über Main-Header (z-index: 9999)",
        "Dropdown Search Visibility - Dunkler Hintergrund mit lesbarem Text",
        "FileBrowser TypeScript Build - Unused onClose parameter entfernt",
        "OAuth Redirect URLs - Dynamische URL-Generierung für alle Plattformen",
        "Netlify Build Issues - Monorepo-Struktur korrekt konfiguriert",
        "GitHub Actions Analytics - Workflow nach Monorepo-Migration wiederhergestellt",
        "Chat Conversation Creation - Korrekte Member-Zuweisung bei neuen Conversations",
        "RLS Policy Conflicts - Duplicate SELECT policies für message_attachments behoben"
      ],
      changed: [
        "Monorepo Restructure - npm workspaces mit web/frontend, web/backend, packages/",
        "SendFileModal Compact Design - Kleinere Drop Zone, farbige Input-Felder",
        "FileBrowser Card Styling - Blue Glow Border + Box-Shadow wie Dashboard",
        "Mobile Table View - Horizontal scrollbare Filter, sticky Header/Footer",
        "User Search - Nur Freunde statt alle User (friendships table)",
        "Storage Strategy - Signed URLs (1h cache) statt Public URLs",
        "Admin Route Permissions - Granulare Moderator-Permissions System"
      ],
      removed: [
        "Hardcoded Netlify URLs - Ersetzt durch window.location.origin",
        "allowed_admin_routes - Vereinfachte Admin-Permission-Logik",
        "Dark Mode Duplicate Styles - Jetzt über CSS Variables zentral"
      ]
    }
  },
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
