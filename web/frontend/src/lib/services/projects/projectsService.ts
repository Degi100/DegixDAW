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

    // Get owned projects
    let ownedQuery = supabase
      .from('projects')
      .select('*')
      .eq('creator_id', user.id);

    // Get collaborated projects
    const { data: collaborations } = await supabase
      .from('project_collaborators')
      .select('project_id')
      .eq('user_id', user.id)
      .not('accepted_at', 'is', null);

    const collaboratedProjectIds = collaborations?.map(c => c.project_id) || [];

    let collaboratedQuery = collaboratedProjectIds.length > 0
      ? supabase.from('projects').select('*').in('id', collaboratedProjectIds)
      : null;

    // Apply additional filters to both queries
    if (options?.filter) {
      const { status, is_public, search } = options.filter;

      if (status) {
        ownedQuery = ownedQuery.eq('status', status);
        if (collaboratedQuery) collaboratedQuery = collaboratedQuery.eq('status', status);
      }

      if (is_public !== undefined) {
        ownedQuery = ownedQuery.eq('is_public', is_public);
        if (collaboratedQuery) collaboratedQuery = collaboratedQuery.eq('is_public', is_public);
      }

      if (search) {
        ownedQuery = ownedQuery.ilike('title', `%${search}%`);
        if (collaboratedQuery) collaboratedQuery = collaboratedQuery.ilike('title', `%${search}%`);
      }
    }

    // Fetch both
    const { data: ownedProjects, error: ownedError } = await ownedQuery;
    if (ownedError) throw ownedError;

    const { data: collaboratedProjects, error: collaboratedError } = collaboratedQuery
      ? await collaboratedQuery
      : { data: [], error: null };
    if (collaboratedError) throw collaboratedError;

    // Combine and remove duplicates (in case user is both creator and collaborator)
    const allProjects = [...(ownedProjects || []), ...(collaboratedProjects || [])];
    const uniqueProjects = Array.from(
      new Map(allProjects.map(p => [p.id, p])).values()
    );

    // Apply sorting
    const sortBy = options?.sortBy || 'updated_at';
    const order = options?.order || 'desc';
    uniqueProjects.sort((a, b) => {
      const aVal = a[sortBy] || '';
      const bVal = b[sortBy] || '';
      return order === 'asc'
        ? aVal > bVal ? 1 : -1
        : aVal < bVal ? 1 : -1;
    });

    // Map to include creator (will be null for now, can be enhanced later)
    return uniqueProjects.map(project => ({
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
    // Step 1: Delete all storage files BEFORE deleting DB records
    // (DB cascade will delete tracks/comments/etc, but Storage files stay!)

    // Define all storage paths for this project
    const storagePaths = [
      { bucket: 'music-projects', prefix: `midi/${projectId}` },
      { bucket: 'music-projects', prefix: `audio/${projectId}` },
      { bucket: 'music-projects', prefix: `mixdowns/${projectId}` },
      { bucket: 'project-thumbnails', prefix: `${projectId}` },
    ];

    // Delete files from each storage path
    for (const { bucket, prefix } of storagePaths) {
      try {
        // List all files in this folder
        const { data: files, error: listError } = await supabase.storage
          .from(bucket)
          .list(prefix);

        if (listError) {
          console.warn(`Failed to list files in ${bucket}/${prefix}:`, listError);
          continue; // Continue cleanup even if one folder fails
        }

        if (files && files.length > 0) {
          // Build full paths for deletion
          const filePaths = files.map(f => `${prefix}/${f.name}`);

          // Delete all files in this folder
          const { error: deleteError } = await supabase.storage
            .from(bucket)
            .remove(filePaths);

          if (deleteError) {
            console.warn(`Failed to delete files in ${bucket}/${prefix}:`, deleteError);
          }
        }
      } catch (storageError) {
        console.warn(`Storage cleanup error for ${bucket}/${prefix}:`, storageError);
        // Continue cleanup even if one bucket fails
      }
    }

    // Step 2: Delete DB record (CASCADE will delete tracks, comments, collaborators, etc.)
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
