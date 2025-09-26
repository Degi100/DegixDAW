// src/lib/constants/index.ts
// Barrel export for all constants

// App-wide constants
export {
  APP_CONFIG,
  EMOJIS,
  ROUTES,
  SOCIAL_PROVIDERS,
  UI_TEXT,
  PLACEHOLDER_TEXT,
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
import { FEATURES, BENEFITS, PROJECT_TEMPLATES, HELP_TOPICS } from './content';

// Re-exports for common usage patterns
export const APP_NAME = APP_CONFIG.name;
export const APP_FULL_NAME = APP_CONFIG.fullName;
export const APP_LOGO = EMOJIS.logo;

// Utility functions for working with constants
export const getFeaturesByCategory = (category: string) => {
  return FEATURES.filter((feature) => feature.category === category);
};

export const getBenefitsByCategory = (category: string) => {
  return BENEFITS.filter((benefit) => benefit.category === category);
};

export const getProjectTemplatesByCategory = (category: string) => {
  return PROJECT_TEMPLATES.filter((template) => template.category === category);
};

export const getHelpTopicsByDifficulty = (difficulty: 'beginner' | 'intermediate' | 'advanced') => {
  return HELP_TOPICS.filter((topic) => topic.difficulty === difficulty);
};

export const getHelpTopicsByCategory = (category: string) => {
  return HELP_TOPICS.filter((topic) => topic.category === category);
};