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
    // Step 1: Get project owner/creator
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('creator_id')
      .eq('id', projectId)
      .single();

    if (projectError) {
      console.error('Error fetching project:', projectError);
      throw projectError;
    }

    // Step 2: Get collaborators
    const { data: collaborators, error: collabError } = await supabase
      .from('project_collaborators')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true });

    if (collabError) {
      console.error('Error fetching collaborators:', collabError);
      throw collabError;
    }

    // Step 3: Get all user IDs (owner + collaborators)
    const userIds = [project.creator_id];
    if (collaborators && collaborators.length > 0) {
      userIds.push(...collaborators.map((c) => c.user_id));
    }

    // Step 3: Fetch profiles for all users (email is NOT in profiles table)
    let profilesQuery = supabase
      .from('profiles')
      .select('id, username, avatar_url');

    // Use .eq() for single user, .in() for multiple (avoids encoding issues)
    if (userIds.length === 1) {
      profilesQuery = profilesQuery.eq('id', userIds[0]);
    } else {
      profilesQuery = profilesQuery.in('id', userIds);
    }

    const { data: profiles, error: profilesError } = await profilesQuery;

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      // Continue without profiles
    }

    // Step 4: Map profiles to collaborators
    const profilesMap = new Map(profiles?.map((p) => [p.id, p]) || []);

    // Step 5: Build result list (owner first, then collaborators)
    const result: ProjectCollaborator[] = [];

    // Add owner as first collaborator with 'owner' role and full permissions
    const ownerProfile = profilesMap.get(project.creator_id);
    result.push({
      id: `owner-${project.creator_id}`, // Synthetic ID for owner
      project_id: projectId,
      user_id: project.creator_id,
      role: 'owner',
      can_edit: true,
      can_download: true,
      can_upload_audio: true,
      can_upload_mixdown: true,
      can_comment: true,
      can_invite_others: true,
      invited_by: null,
      invited_at: null,
      accepted_at: null,
      created_at: new Date().toISOString(), // Use current time or project creation time
      username: ownerProfile?.username || null,
      email: null,
      avatar_url: ownerProfile?.avatar_url || null
    });

    // Add invited collaborators
    if (collaborators && collaborators.length > 0) {
      result.push(...collaborators.map((collab) => {
        const profile = profilesMap.get(collab.user_id);
        return {
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
          username: profile?.username || null,
          email: null,
          avatar_url: profile?.avatar_url || null
        };
      }));
    }

    return result;
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
// Invite Non-Registered User by Email (via Edge Function)
// Sends email with magic link + stores in DB for auto-add after signup
// ============================================

export interface InviteByEmailData {
  email: string;
  projectId: string;
  projectName: string;
  role: CollaboratorRole;
  permissions: Omit<InviteCollaboratorData, 'user_id'>;
}

export async function inviteByEmail(data: InviteByEmailData): Promise<{ success: boolean; message: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Step 1: Store pending invitation in database (for auto-add trigger)
    const { error: insertError } = await supabase
      .from('pending_email_invitations')
      .insert({
        email: data.email.toLowerCase().trim(),
        project_id: data.projectId,
        invited_by: user.id,
        role: data.role,
        permissions: data.permissions,
        status: 'pending'
      });

    if (insertError) {
      console.error('Failed to create pending invitation:', insertError);

      // Check if it's a duplicate
      if (insertError.code === '23505') {
        return {
          success: false,
          message: 'This email has already been invited to this project'
        };
      }

      throw new Error('Failed to create invitation');
    }

    console.log(`✅ Pending invitation stored in DB for ${data.email}`);

    // Step 2: Call Edge Function to send email with magic link
    const { data: { session } } = await supabase.auth.getSession();
    const EDGE_FUNCTION_URL = 'https://xcdzugnjzrkngzmtzeip.supabase.co/functions/v1/invite-user';

    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`,
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        email: data.email.toLowerCase().trim(),
        projectId: data.projectId,
        projectName: data.projectName,
        role: data.role,
        permissions: data.permissions,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Edge Function error:', errorData);
      throw new Error(errorData.error || 'Failed to send invitation email');
    }

    await response.json(); // Consume response
    console.log(`✅ Invitation email sent to ${data.email}`);
    console.log(`📧 User will receive magic link → redirects to /welcome`);

    return {
      success: true,
      message: `Invitation sent to ${data.email}! They will receive an email with a signup link.`,
    };
  } catch (error: any) {
    console.error('inviteByEmail failed:', error);
    return {
      success: false,
      message: error.message || 'Failed to send invitation',
    };
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
