/**
 * Project Milestones - Curated from Git History
 *
 * Major features, releases, and achievements
 * Extracted from: git log --pretty=format:"%h|%ai|%s"
 *
 * Format: Newest first
 */

import type { Milestone } from '../services/analytics/types';

export const milestones: Milestone[] = [
  {
    id: 'm11',
    date: '2025-10-10',
    title: 'Speech-to-Text System',
    icon: '🎤',
    category: 'feature',
    commit_hash: 'd1c3bc9',
    description: 'Admin Issues können via Spracheingabe erstellt werden'
  },
  {
    id: 'm10',
    date: '2025-10-10',
    title: 'RoleBadge Component',
    icon: '🎨',
    category: 'feature',
    commit_hash: '4be2252',
    description: 'User-Roles visuell mit Emojis und Styling'
  },
  {
    id: 'm9',
    date: '2025-10-10',
    title: 'Comments System',
    icon: '💬',
    category: 'feature',
    commit_hash: '2c04d25',
    description: 'Issue-Kommentare mit Action-Log'
  },
  {
    id: 'm8',
    date: '2025-10-10',
    title: 'Claude Issues Integration',
    icon: '🤖',
    category: 'feature',
    commit_hash: '4d750d8',
    description: 'Auto-Status + Lock-System für Issues'
  },
  {
    id: 'm7',
    date: '2025-10-09',
    title: 'Granulare Admin Route Permissions',
    icon: '🔐',
    category: 'feature',
    commit_hash: '55d84c9',
    description: 'Super-Admin kann pro Admin festlegen welche Routen zugänglich sind'
  },
  {
    id: 'm6',
    date: '2025-10-09',
    title: 'Issues System Launch',
    icon: '🐛',
    category: 'feature',
    commit_hash: 'd315e36',
    description: 'Vollständiges Issue-Tracking mit Assignment + Comments'
  },
  {
    id: 'm5',
    date: '2025-10-09',
    title: 'Beta-User Role',
    icon: '🧪',
    category: 'feature',
    commit_hash: '6daeb78',
    description: 'Premium Tester Role mit frühem Zugriff'
  },
  {
    id: 'm4',
    date: '2025-10-08',
    title: 'Admin Role-Management System',
    icon: '👑',
    category: 'feature',
    commit_hash: '95a2249',
    description: 'Super-Admin Protection + Bulk Operations'
  },
  {
    id: 'm3',
    date: '2025-09-28',
    title: 'Chat System v2',
    icon: '💬',
    category: 'feature',
    commit_hash: '875c428',
    description: 'Echtzeit-Chat mit Freundschafts-Validierung'
  },
  {
    id: 'm2',
    date: '2025-09-26',
    title: 'Major Refactoring',
    icon: '🔧',
    category: 'code',
    commit_hash: '09e94b4',
    description: 'Modular Architecture + 61% Code Reduction'
  },
  {
    id: 'm1',
    date: '2025-09-25',
    title: 'Professional Architecture',
    icon: '🏗️',
    category: 'milestone',
    commit_hash: 'd7539b1',
    description: 'Complete React 19 Architecture Setup'
  },
  {
    id: 'm0',
    date: '2025-09-24',
    title: 'Initial Commit',
    icon: '🎉',
    category: 'milestone',
    commit_hash: 'dc824ab',
    description: 'Projektstart - DegixDAW Frontend'
  }
];

/**
 * Get milestones by category
 */
export function getMilestonesByCategory(category: Milestone['category']): Milestone[] {
  return milestones.filter(m => m.category === category);
}

/**
 * Get recent milestones (last N)
 */
export function getRecentMilestones(limit: number = 6): Milestone[] {
  return milestones.slice(0, limit);
}

/**
 * Get milestone by commit hash
 */
export function getMilestoneByCommit(commitHash: string): Milestone | undefined {
  return milestones.find(m => m.commit_hash === commitHash);
}
