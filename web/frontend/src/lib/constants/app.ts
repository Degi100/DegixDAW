// src/lib/constants/app.ts
// Application-wide constants and branding

import packageJson from '../../../package.json';

export const APP_CONFIG = {
  name: 'DegixDAW',
  fullName: '🎧 DegixDAW',
  tagline: 'Professional Digital Audio Workstation',
  description: 'Collaborative music production platform for professionals',
  version: packageJson.version,
} as const;

export const EMOJIS = {
  // App branding
  logo: '🎧',
  music: '🎵',
  
  // Features
  daw: '🎛️',
  global: '🌍',
  realtime: '⚡',
  audio: '🔊',
  cloud: '📁',
  midi: '🎹',
  
  // Benefits
  save: '💾',
  collaborate: '🤝',
  favorite: '⭐',
  community: '🎯',
  sync: '☁️',
  
  // UI elements
  lock: '🔓',
  projects: '🎼',
  
  // Actions
  success: '✅',
  error: '❌',
  warning: '⚠️',
  info: 'ℹ️',
} as const;

export const ROUTES = {
  home: '/',
  login: '/login',
  register: '/register',
  dashboard: '/dashboard',
  settings: '/settings',
  projects: '/projects',
  profile: '/profile',
  authCallback: '/auth/callback',
} as const;

export const SOCIAL_PROVIDERS = {
  google: 'google',
  github: 'github',
  discord: 'discord',
} as const;

export const UI_TEXT = {
  // Navigation
  login: 'Anmelden',
  register: 'Registrieren',
  logout: 'Abmelden',
  settings: 'Einstellungen',
  profile: 'Profil',
  
  // Common actions
  save: 'Speichern',
  cancel: 'Abbrechen',
  delete: 'Löschen',
  edit: 'Bearbeiten',
  back: 'Zurück',
  next: 'Weiter',
  submit: 'Absenden',
  continue: 'Fortfahren',
  
  // Status messages
  loading: 'Lädt...',
  success: 'Erfolgreich!',
  error: 'Fehler aufgetreten',
  saving: 'Speichere...',
  
  // Welcome messages
  welcomeBack: 'Willkommen zurück!',
  welcomeToApp: 'Willkommen bei DegixDAW',
  getStarted: 'Jetzt loslegen',
  
  // Auth
  signInWith: 'Anmelden mit',
  signUpWith: 'Registrieren mit',
  orContinueWith: 'Oder fortfahren mit',
  noAccountYet: 'Noch kein Konto?',
  alreadyHaveAccount: 'Bereits ein Konto?',
  forgotPassword: 'Passwort vergessen?',
  
  // Form labels
  email: 'E-Mail',
  password: 'Passwort',
  confirmPassword: 'Passwort bestätigen',
  fullName: 'Vollständiger Name',
  username: 'Benutzername',
  currentPassword: 'Aktuelles Passwort',
  newPassword: 'Neues Passwort',
  
  // Validation messages
  required: 'Dieses Feld ist erforderlich',
  invalidEmail: 'Ungültige E-Mail-Adresse',
  passwordTooShort: 'Passwort zu kurz',
  passwordsNotMatch: 'Passwörter stimmen nicht überein',
  
  // Dashboard
  dashboard: 'Dashboard',
  myProjects: 'Meine Projekte',
  recentActivity: 'Letzte Aktivitäten',
  quickActions: 'Schnellzugriff',
  
  // Projects
  createProject: 'Neues Projekt erstellen',
  openProject: 'Projekt öffnen',
  projectName: 'Projektname',
  projectDescription: 'Projektbeschreibung',
  
  // Settings
  accountSettings: 'Kontoeinstellungen',
  profileSettings: 'Profil-Einstellungen',
  passwordChange: 'Passwort ändern',
  dangerZone: 'Gefahrenbereich',
  deleteAccount: 'Konto löschen',
} as const;

