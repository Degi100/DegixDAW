// src/lib/constants/content.ts
// Static content data for features, benefits, and other repeated content

import { EMOJIS } from './app';

// Feature definition interface
export interface Feature {
  icon: string;
  title: string;
  description: string;
  category?: string;
}

// Benefit definition interface
export interface Benefit {
  icon: string;
  text: string;
  category?: string;
}

// Main application features
export const FEATURES: readonly Feature[] = [
  {
    icon: EMOJIS.daw,
    title: 'DAW-Integration',
    description: 'Nahtlose Integration mit professionellen Digital Audio Workstations',
    category: 'integration'
  },
  {
    icon: EMOJIS.global,
    title: 'Globaler Austausch',
    description: 'Teilen und kollaborieren Sie mit Musikern weltweit',
    category: 'collaboration'
  },
  {
    icon: EMOJIS.realtime,
    title: 'Echtzeit-Kollaboration',
    description: 'Arbeiten Sie in Echtzeit an Projekten mit anderen',
    category: 'collaboration'
  },
  {
    icon: EMOJIS.audio,
    title: 'High-Quality Audio',
    description: 'Verlustfreie Audio-Verarbeitung und -Übertragung',
    category: 'audio'
  },
  {
    icon: EMOJIS.cloud,
    title: 'Cloud-Verwaltung',
    description: 'Sichere Cloud-basierte Projektverwaltung',
    category: 'storage'
  },
  {
    icon: EMOJIS.midi,
    title: 'MIDI & VST Support',
    description: 'Vollständige MIDI-Unterstützung und VST-Integration',
    category: 'audio'
  }
] as const;

// Benefits for signed-up users
export const BENEFITS: readonly Benefit[] = [
  {
    icon: EMOJIS.save,
    text: 'Eigene Audio- und MIDI-Aufnahmen speichern',
    category: 'storage'
  },
  {
    icon: EMOJIS.collaborate,
    text: 'Ideen mit anderen Musikern teilen',
    category: 'collaboration'
  },
  {
    icon: EMOJIS.favorite,
    text: 'Favoriten markieren und organisieren',
    category: 'organization'
  },
  {
    icon: EMOJIS.community,
    text: 'An Community-Projekten teilnehmen',
    category: 'community'
  },
  {
    icon: EMOJIS.sync,
    text: 'Cloud-Synchronisation für alle Geräte',
    category: 'sync'
  }
] as const;

// Project template data
export interface ProjectTemplate {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: string;
  tags: readonly string[];
}

export const PROJECT_TEMPLATES: readonly ProjectTemplate[] = [
  {
    id: 'empty',
    title: 'Leeres Projekt',
    description: 'Starten Sie mit einem komplett leeren Projekt',
    category: 'basic',
    icon: '📄',
    tags: ['grundlagen', 'leer']
  },
  {
    id: 'band',
    title: 'Band Setup',
    description: 'Vollständiges Multi-Track Setup für Bandaufnahmen',
    category: 'recording',
    icon: '🎸',
    tags: ['band', 'recording', 'multitrack']
  },
  {
    id: 'electronic',
    title: 'Electronic Music',
    description: 'Template für elektronische Musikproduktion',
    category: 'electronic',
    icon: '🎛️',
    tags: ['electronic', 'synth', 'drum machine']
  },
  {
    id: 'podcast',
    title: 'Podcast Setup',
    description: 'Optimiert für Podcast-Aufnahmen und -Bearbeitung',
    category: 'spoken',
    icon: '🎙️',
    tags: ['podcast', 'voice', 'interview']
  }
] as const;

// Quick action definitions
export interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: string;
  action: string;
  category: string;
}

export const QUICK_ACTIONS: readonly QuickAction[] = [
  {
    id: 'new-project',
    title: 'Neues Projekt',
    description: 'Erstellen Sie ein neues Musikprojekt',
    icon: '➕',
    action: 'create-project',
    category: 'project'
  },
  {
    id: 'import-audio',
    title: 'Audio importieren',
    description: 'Laden Sie Audio-Dateien in Ihr Projekt',
    icon: '📂',
    action: 'import-audio',
    category: 'import'
  },
  {
    id: 'record',
    title: 'Aufnahme starten',
    description: 'Beginnen Sie eine neue Aufnahme',
    icon: '🔴',
    action: 'start-recording',
    category: 'recording'
  },
  {
    id: 'collaborate',
    title: 'Kollaborieren',
    description: 'Laden Sie andere Musiker zur Zusammenarbeit ein',
    icon: EMOJIS.collaborate,
    action: 'invite-collaborators',
    category: 'collaboration'
  }
] as const;

// Help and documentation topics
export interface HelpTopic {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export const HELP_TOPICS: readonly HelpTopic[] = [
  {
    id: 'getting-started',
    title: 'Erste Schritte',
    description: 'Grundlagen für den Einstieg in DegixDAW',
    category: 'basics',
    icon: '🚀',
    difficulty: 'beginner'
  },
  {
    id: 'recording',
    title: 'Aufnahme-Grundlagen',
    description: 'Lernen Sie die Grundlagen der Audioaufnahme',
    category: 'recording',
    icon: '🎤',
    difficulty: 'beginner'
  },
  {
    id: 'mixing',
    title: 'Mixing & Mastering',
    description: 'Professionelle Mixing-Techniken',
    category: 'production',
    icon: '🎚️',
    difficulty: 'intermediate'
  },
  {
    id: 'collaboration',
    title: 'Zusammenarbeit',
    description: 'Effektiv mit anderen Musikern kollaborieren',
    category: 'workflow',
    icon: EMOJIS.collaborate,
    difficulty: 'intermediate'
  },
  {
    id: 'advanced-routing',
    title: 'Erweiterte Routing-Techniken',
    description: 'Komplexe Audio-Routing-Setups',
    category: 'advanced',
    icon: '🔀',
    difficulty: 'advanced'
  }
] as const;

// Content categories for filtering and organization
export const CONTENT_CATEGORIES = {
  features: {
    integration: 'Integration',
    collaboration: 'Zusammenarbeit',
    audio: 'Audio',
    storage: 'Speicherung'
  },
  benefits: {
    storage: 'Speicherung',
    collaboration: 'Zusammenarbeit',
    organization: 'Organisation',
    community: 'Community',
    sync: 'Synchronisation'
  },
  projects: {
    basic: 'Grundlagen',
    recording: 'Aufnahme',
    electronic: 'Electronic',
    spoken: 'Gesprochenes'
  },
  help: {
    basics: 'Grundlagen',
    recording: 'Aufnahme',
    production: 'Produktion',
    workflow: 'Arbeitsablauf',
    advanced: 'Erweitert'
  }
} as const;