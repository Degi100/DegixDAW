/**
 * Milestones Service - Custom Milestones CRUD
 *
 * Manages project milestones from database
 * Merges with hardcoded milestones from milestones.ts
 *
 * Usage:
 * import { getAllMilestones, createMilestone, deleteMilestone } from './milestonesService';
 */

import { supabase } from '../../supabase';
import type { Milestone } from './types';
import { milestones as hardcodedMilestones } from '../../constants/milestones';

/**
 * Database Milestone Interface
 */
interface DbMilestone {
  id: string;
  title: string;
  description: string | null;
  icon: string;
  category: string;
  milestone_date: string;
  commit_hash: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Convert DB milestone to Milestone type
 */
function dbToMilestone(db: DbMilestone): Milestone & { isCustom: boolean; createdBy: string | null } {
  const milestone: Milestone & { isCustom: boolean; createdBy: string | null } = {
    id: db.id,
    date: db.milestone_date,
    title: db.title,
    icon: db.icon,
    category: db.category as Milestone['category'],
    isCustom: true,
    createdBy: db.created_by
  };

  if (db.commit_hash) milestone.commit_hash = db.commit_hash;
  if (db.description) milestone.description = db.description;

  return milestone;
}

/**
 * Get all milestones (hardcoded + custom from DB)
 * Sorted by date DESC (newest first)
 */
export async function getAllMilestones(): Promise<Array<Milestone & { isCustom: boolean; createdBy?: string | null }>> {
  try {
    // Fetch custom milestones from DB
    const { data: customMilestones, error } = await supabase
      .from('project_milestones')
      .select('*')
      .order('milestone_date', { ascending: false });

    if (error) {
      console.error('[MilestonesService] Failed to fetch custom milestones:', error);
      // Fallback to hardcoded only
      return hardcodedMilestones.map(m => ({ ...m, isCustom: false }));
    }

    // Convert DB milestones
    const dbMilestones = (customMilestones || []).map(dbToMilestone);

    // Merge with hardcoded milestones
    const allMilestones = [
      ...dbMilestones,
      ...hardcodedMilestones.map(m => ({ ...m, isCustom: false }))
    ];

    // Sort by date DESC
    allMilestones.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return allMilestones;
  } catch (error) {
    console.error('[MilestonesService] Error in getAllMilestones:', error);
    return hardcodedMilestones.map(m => ({ ...m, isCustom: false }));
  }
}

/**
 * Create new milestone
 */
export interface CreateMilestoneInput {
  title: string;
  description?: string;
  icon: string;
  category: Milestone['category'];
  milestone_date: string; // YYYY-MM-DD
  commit_hash?: string;
}

export async function createMilestone(input: CreateMilestoneInput): Promise<Milestone> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Not authenticated');
  }

  const { data, error } = await supabase
    .from('project_milestones')
    .insert({
      title: input.title,
      description: input.description || null,
      icon: input.icon,
      category: input.category,
      milestone_date: input.milestone_date,
      commit_hash: input.commit_hash || null,
      created_by: user.id
    })
    .select()
    .single();

  if (error) {
    console.error('[MilestonesService] Failed to create milestone:', error);
    throw error;
  }

  console.log('[MilestonesService] Milestone created:', data.id);
  return dbToMilestone(data);
}

/**
 * Update milestone (only own milestones)
 */
export interface UpdateMilestoneInput {
  id: string;
  title?: string;
  description?: string;
  icon?: string;
  category?: Milestone['category'];
  milestone_date?: string;
  commit_hash?: string;
}

export async function updateMilestone(input: UpdateMilestoneInput): Promise<Milestone> {
  const { id, ...updates } = input;

  // Convert milestone_date to DB field name
  const dbUpdates: Record<string, unknown> = {};
  if (updates.title) dbUpdates.title = updates.title;
  if (updates.description !== undefined) dbUpdates.description = updates.description;
  if (updates.icon) dbUpdates.icon = updates.icon;
  if (updates.category) dbUpdates.category = updates.category;
  if (updates.milestone_date) dbUpdates.milestone_date = updates.milestone_date;
  if (updates.commit_hash !== undefined) dbUpdates.commit_hash = updates.commit_hash;

  const { data, error } = await supabase
    .from('project_milestones')
    .update(dbUpdates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('[MilestonesService] Failed to update milestone:', error);
    throw error;
  }

  console.log('[MilestonesService] Milestone updated:', id);
  return dbToMilestone(data);
}

/**
 * Delete milestone (only own milestones)
 */
export async function deleteMilestone(id: string): Promise<void> {
  const { error } = await supabase
    .from('project_milestones')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('[MilestonesService] Failed to delete milestone:', error);
    throw error;
  }

  console.log('[MilestonesService] Milestone deleted:', id);
}

/**
 * Check if user can edit/delete milestone
 */
export async function canModifyMilestone(milestoneId: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return false;

  const { data, error } = await supabase
    .from('project_milestones')
    .select('created_by')
    .eq('id', milestoneId)
    .single();

  if (error || !data) return false;

  return data.created_by === user.id;
}
