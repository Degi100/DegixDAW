// ============================================
// COLLABORATORS SERVICE
// API layer for project collaborator management
// ============================================

import { supabase } from '../../supabase';
import type {
  ProjectCollaborator,
  CollaboratorRole,
} from '../../../types/projects';

// ============================================
// Get Project Collaborators
// ============================================

export async function getProjectCollaborators(
  projectId: string
): Promise<ProjectCollaborator[]> {
  try {
    const { data, error } = await supabase
      .from('project_collaborators')
      .select(`
        *,
        profiles!project_collaborators_user_id_fkey (
          username,
          email,
          avatar_url
        )
      `)
      .eq('project_id', projectId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching collaborators:', error);
      throw error;
    }

    if (!data) return [];

    // Flatten profiles into collaborator object
    return data.map((collab) => ({
      id: collab.id,
      project_id: collab.project_id,
      user_id: collab.user_id,
      role: collab.role,
      can_edit: collab.can_edit,
      can_download: collab.can_download,
      can_upload_audio: collab.can_upload_audio,
      can_upload_mixdown: collab.can_upload_mixdown,
      can_comment: collab.can_comment,
      can_invite_others: collab.can_invite_others,
      invited_by: collab.invited_by,
      invited_at: collab.invited_at,
      accepted_at: collab.accepted_at,
      created_at: collab.created_at,
      // @ts-ignore - Supabase JOIN result
      username: collab.profiles?.username || null,
      // @ts-ignore
      email: collab.profiles?.email || null,
      // @ts-ignore
      avatar_url: collab.profiles?.avatar_url || null,
    }));
  } catch (error) {
    console.error('getProjectCollaborators failed:', error);
    return [];
  }
}

// ============================================
// Invite User to Project
// ============================================

export interface InviteCollaboratorData {
  user_id: string;
  role: CollaboratorRole;
  can_edit: boolean;
  can_download: boolean;
  can_upload_audio: boolean;
  can_upload_mixdown: boolean;
  can_comment: boolean;
  can_invite_others: boolean;
}

export async function inviteCollaborator(
  projectId: string,
  data: InviteCollaboratorData
): Promise<ProjectCollaborator | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data: collaborator, error } = await supabase
      .from('project_collaborators')
      .insert({
        project_id: projectId,
        user_id: data.user_id,
        role: data.role,
        can_edit: data.can_edit,
        can_download: data.can_download,
        can_upload_audio: data.can_upload_audio,
        can_upload_mixdown: data.can_upload_mixdown,
        can_comment: data.can_comment,
        can_invite_others: data.can_invite_others,
        invited_by: user.id,
        invited_at: new Date().toISOString(),
        accepted_at: null, // Pending until user accepts
      })
      .select()
      .single();

    if (error) {
      console.error('Error inviting collaborator:', error);
      throw error;
    }

    return collaborator;
  } catch (error) {
    console.error('inviteCollaborator failed:', error);
    return null;
  }
}

// ============================================
// Accept Collaboration Invite
// ============================================

export async function acceptInvite(collaboratorId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('project_collaborators')
      .update({
        accepted_at: new Date().toISOString(),
      })
      .eq('id', collaboratorId);

    if (error) {
      console.error('Error accepting invite:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('acceptInvite failed:', error);
    return false;
  }
}

// ============================================
// Reject/Remove Collaborator
// ============================================

export async function removeCollaborator(collaboratorId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('project_collaborators')
      .delete()
      .eq('id', collaboratorId);

    if (error) {
      console.error('Error removing collaborator:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('removeCollaborator failed:', error);
    return false;
  }
}

// ============================================
// Update Collaborator Permissions
// ============================================

export async function updateCollaboratorPermissions(
  collaboratorId: string,
  updates: Partial<ProjectCollaborator>
): Promise<ProjectCollaborator | null> {
  try {
    const { data, error } = await supabase
      .from('project_collaborators')
      .update(updates)
      .eq('id', collaboratorId)
      .select()
      .single();

    if (error) {
      console.error('Error updating collaborator permissions:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('updateCollaboratorPermissions failed:', error);
    return null;
  }
}

// ============================================
// Get User's Pending Invites
// ============================================

export async function getUserPendingInvites(): Promise<ProjectCollaborator[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('project_collaborators')
      .select(`
        *,
        projects (
          id,
          title,
          creator_id
        )
      `)
      .eq('user_id', user.id)
      .is('accepted_at', null)
      .order('invited_at', { ascending: false });

    if (error) {
      console.error('Error fetching pending invites:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('getUserPendingInvites failed:', error);
    return [];
  }
}

// ============================================
// Lookup User ID by Email (requires RPC function)
// ============================================

export async function getUserIdByEmail(email: string): Promise<string | null> {
  try {
    // This requires a Supabase RPC function (similar to get_user_id_by_email for issues)
    const { data, error } = await supabase.rpc('get_user_id_by_email', {
      user_email: email,
    });

    if (error) {
      console.error('Error looking up user by email:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('getUserIdByEmail failed:', error);
    return null;
  }
}
