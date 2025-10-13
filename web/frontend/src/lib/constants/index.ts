// src/lib/constants/index.ts
// Barrel export for all constants

// App-wide constants
export {
  APP_CONFIG,
  EMOJIS,
  ROUTES,
  SOCIAL_PROVIDERS,
  UI_TEXT,
} from './app';

// Content constants
export {
  FEATURES,
  BENEFITS,
  PROJECT_TEMPLATES,
  QUICK_ACTIONS,
  HELP_TOPICS,
  CONTENT_CATEGORIES,
  type Feature,
  type Benefit,
  type ProjectTemplate,
  type QuickAction,
  type HelpTopic,
} from './content';

// Import for utility functions
import { APP_CONFIG, EMOJIS } from './app';

// Re-exports for common usage patterns
export const APP_NAME = APP_CONFIG.name;
export const APP_FULL_NAME = APP_CONFIG.fullName;
export const APP_LOGO = EMOJIS.logo;

