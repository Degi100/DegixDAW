// ============================================
// PROJECTS SERVICE
// API layer for project CRUD operations
// ============================================

import { supabase } from '../../supabase';
import type {
  Project,
  ProjectWithCreator,
  CreateProjectRequest,
  UpdateProjectRequest,
  ProjectsFilter,
  ProjectsQueryOptions,
} from '../../../types/projects';

// ============================================
// Create Project
// ============================================

export async function createProject(data: CreateProjectRequest): Promise<Project | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('User not authenticated');
    }

    const projectData = {
      creator_id: user.id,
      title: data.title,
      description: data.description || null,
      bpm: data.bpm || 120,
      time_signature: data.time_signature || '4/4',
      key: data.key || null,
      is_public: data.is_public || false,
      status: 'draft' as const,
    };

    const { data: project, error } = await supabase
      .from('projects')
      .insert(projectData)
      .select()
      .single();

    if (error) {
      console.error('Error creating project:', error);
      throw error;
    }

    return project;
  } catch (error) {
    console.error('createProject failed:', error);
    return null;
  }
}

// ============================================
// Get Projects List
// ============================================

export async function getProjects(
  options?: ProjectsQueryOptions
): Promise<ProjectWithCreator[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('User not authenticated');
    }

    let query = supabase
      .from('projects')
      .select('*');

    // Filter: Only projects user owns (for now, collaborators feature comes later)
    query = query.eq('creator_id', user.id);

    // Apply additional filters
    if (options?.filter) {
      const { status, is_public, search } = options.filter;

      if (status) {
        query = query.eq('status', status);
      }

      if (is_public !== undefined) {
        query = query.eq('is_public', is_public);
      }

      if (search) {
        query = query.ilike('title', `%${search}%`);
      }
    }

    // Apply sorting
    const sortBy = options?.sortBy || 'updated_at';
    const order = options?.order || 'desc';
    query = query.order(sortBy, { ascending: order === 'asc' });

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching projects:', error);
      throw error;
    }

    // Map to include creator (will be null for now, can be enhanced later)
    return (data || []).map(project => ({
      ...project,
      creator: null,
    }));
  } catch (error) {
    console.error('getProjects failed:', error);
    return [];
  }
}

// ============================================
// Get Single Project
// ============================================

export async function getProject(projectId: string): Promise<ProjectWithCreator | null> {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (error) {
      console.error('Error fetching project:', error);
      throw error;
    }

    // Add creator field (null for now, can be enhanced later)
    return {
      ...data,
      creator: null,
    };
  } catch (error) {
    console.error('getProject failed:', error);
    return null;
  }
}

// ============================================
// Update Project
// ============================================

export async function updateProject(
  projectId: string,
  updates: UpdateProjectRequest
): Promise<Project | null> {
  try {
    const { data, error } = await supabase
      .from('projects')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', projectId)
      .select()
      .single();

    if (error) {
      console.error('Error updating project:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('updateProject failed:', error);
    return null;
  }
}

// ============================================
// Delete Project
// ============================================

export async function deleteProject(projectId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId);

    if (error) {
      console.error('Error deleting project:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('deleteProject failed:', error);
    return false;
  }
}

// ============================================
// Get My Projects (owned by current user)
// ============================================

export async function getMyProjects(): Promise<ProjectWithCreator[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('creator_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching my projects:', error);
      throw error;
    }

    // Map to include creator (will be null for now)
    return (data || []).map(project => ({
      ...project,
      creator: null,
    }));
  } catch (error) {
    console.error('getMyProjects failed:', error);
    return [];
  }
}

// ============================================
// Get Collaborated Projects (where user is collaborator)
// ============================================

export async function getCollaboratedProjects(): Promise<ProjectWithCreator[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('User not authenticated');
    }

    // Get project IDs where user is collaborator
    const { data: collaborations, error: collabError } = await supabase
      .from('project_collaborators')
      .select('project_id')
      .eq('user_id', user.id)
      .not('accepted_at', 'is', null);

    if (collabError) {
      console.error('Error fetching collaborations:', collabError);
      throw collabError;
    }

    if (!collaborations || collaborations.length === 0) {
      return [];
    }

    const projectIds = collaborations.map(c => c.project_id);

    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .in('id', projectIds)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching collaborated projects:', error);
      throw error;
    }

    // Map to include creator (will be null for now)
    return (data || []).map(project => ({
      ...project,
      creator: null,
    }));
  } catch (error) {
    console.error('getCollaboratedProjects failed:', error);
    return [];
  }
}

// ============================================
// Subscribe to Project Updates (Realtime)
// ============================================

export function subscribeToProject(
  projectId: string,
  callback: (project: Project) => void
) {
  const channel = supabase
    .channel(`project:${projectId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'projects',
        filter: `id=eq.${projectId}`,
      },
      (payload) => {
        callback(payload.new as Project);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
