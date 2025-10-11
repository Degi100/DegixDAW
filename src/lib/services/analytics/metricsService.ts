/**
 * Metrics Service - Project Statistics
 *
 * Provides real-time metrics from:
 * - Users (total, active, roles)
 * - Messages & Conversations
 * - Issues (status breakdown)
 * - Code (Git-based LOC, files, commits)
 */

import { supabase } from '../../supabase';
import { getCodeMetrics } from './codeMetricsService.browser';
import type { ProjectMetrics, UserMetrics, MessageMetrics, IssueMetrics } from './types';

/**
 * Get user metrics from profiles table
 */
export async function getUserMetrics(): Promise<UserMetrics> {
  try {
    // Total users
    const { count: total } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    // Active users (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { count: active } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('last_seen_at', sevenDaysAgo.toISOString());

    // Roles breakdown
    const { data: profiles } = await supabase
      .from('profiles')
      .select('role');

    const admins = profiles?.filter(p => p.role === 'admin').length || 0;
    const moderators = profiles?.filter(p => p.role === 'moderator').length || 0;
    const beta_users = profiles?.filter(p => p.role === 'beta_user').length || 0;
    const totalUsers = total || 0;
    const regular_users = totalUsers - admins - moderators - beta_users;

    return {
      total: totalUsers,
      active: active || 0,
      admins,
      moderators,
      beta_users,
      regular_users: Math.max(0, regular_users) // Prevent negative
    };
  } catch (error) {
    console.error('[MetricsService] getUserMetrics error:', error);
    return {
      total: 0,
      active: 0,
      admins: 0,
      moderators: 0,
      beta_users: 0,
      regular_users: 0
    };
  }
}

/**
 * Get message metrics from messages table
 */
export async function getMessageMetrics(): Promise<MessageMetrics> {
  try {
    // Total messages
    const { count: total } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true });

    // Messages today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { count: todayCount } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today.toISOString());

    // Total conversations
    const { count: conversations } = await supabase
      .from('conversations')
      .select('*', { count: 'exact', head: true });

    return {
      total: total || 0,
      today: todayCount || 0,
      conversations: conversations || 0
    };
  } catch (error) {
    console.error('[MetricsService] getMessageMetrics error:', error);
    return {
      total: 0,
      today: 0,
      conversations: 0
    };
  }
}

/**
 * Get issue metrics from issues table
 */
export async function getIssueMetrics(): Promise<IssueMetrics> {
  try {
    const { data: issues } = await supabase
      .from('issues')
      .select('status');

    return {
      total: issues?.length || 0,
      open: issues?.filter(i => i.status === 'open').length || 0,
      closed: issues?.filter(i => i.status === 'closed').length || 0,
      in_progress: issues?.filter(i => i.status === 'in_progress').length || 0
    };
  } catch (error) {
    console.error('[MetricsService] getIssueMetrics error:', error);
    return {
      total: 0,
      open: 0,
      closed: 0,
      in_progress: 0
    };
  }
}

/**
 * Get all project metrics (parallel fetch)
 */
export async function getProjectMetrics(): Promise<ProjectMetrics> {
  try {
    console.log('[MetricsService] Fetching project metrics...');

    const [users, messages, issues, code] = await Promise.all([
      getUserMetrics(),
      getMessageMetrics(),
      getIssueMetrics(),
      getCodeMetrics()
    ]);

    console.log('[MetricsService] Metrics fetched successfully');

    return {
      users,
      messages,
      issues,
      code
    };
  } catch (error) {
    console.error('[MetricsService] getProjectMetrics error:', error);
    throw new Error('Failed to fetch project metrics');
  }
}
