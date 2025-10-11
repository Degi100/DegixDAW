/**
 * Project Configuration
 * Central place for project-wide settings
 */

export const PROJECT_CONFIG = {
  name: 'DegixDAW',
  github: {
    owner: 'Degi100',
    repo: 'DegixDAW',
    url: 'https://github.com/Degi100/DegixDAW'
  },
  storage: {
    quotaGB: 1, // Supabase free tier: 1GB
  }
} as const;

/**
 * Get GitHub commit URL
 */
export function getCommitUrl(hash: string): string {
  return `${PROJECT_CONFIG.github.url}/commit/${hash}`;
}

/**
 * Get GitHub compare URL (between two commits)
 */
export function getCompareUrl(from: string, to: string): string {
  return `${PROJECT_CONFIG.github.url}/compare/${from}...${to}`;
}
