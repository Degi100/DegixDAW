// ============================================
// PROJECT VERSIONS SERVICE
// Handles version control/snapshots for projects
// ============================================

import { supabase } from '../../supabase';
import type {
  ProjectVersion,
  ProjectVersionWithCreator,
  ProjectVersionSnapshot,
  CreateProjectVersionRequest,
  Project,
  Track
} from '../../../types/projects';

/**
 * Get all versions for a project (ordered by version_number DESC)
 */
export async function getProjectVersions(
  projectId: string
): Promise<ProjectVersionWithCreator[]> {
  // First get versions
  const { data: versions, error } = await supabase
    .from('project_versions')
    .select('*')
    .eq('project_id', projectId)
    .order('version_number', { ascending: false });

  if (error) {
    console.error('Error fetching project versions:', error);
    throw new Error(`Failed to fetch versions: ${error.message}`);
  }

  if (!versions || versions.length === 0) {
    return [];
  }

  // Get unique creator IDs
  const creatorIds = [...new Set(versions.map(v => v.created_by))];

  // Fetch profiles for all creators
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, username, avatar_url')
    .in('id', creatorIds);

  if (profilesError) {
    console.error('Error fetching creator profiles:', profilesError);
    // Continue without profiles rather than throwing
  }

  // Map profiles to versions
  const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);

  return versions.map(version => ({
    ...version,
    creator: profilesMap.get(version.created_by) || {
      id: version.created_by,
      username: 'Unknown User',
      avatar_url: null,
    },
  })) as ProjectVersionWithCreator[];
}

/**
 * Get a specific version by ID
 */
export async function getProjectVersion(
  versionId: string
): Promise<ProjectVersionWithCreator> {
  // Get version
  const { data: version, error } = await supabase
    .from('project_versions')
    .select('*')
    .eq('id', versionId)
    .single();

  if (error) {
    console.error('Error fetching project version:', error);
    throw new Error(`Failed to fetch version: ${error.message}`);
  }

  // Get creator profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, username, avatar_url')
    .eq('id', version.created_by)
    .single();

  return {
    ...version,
    creator: profile || {
      id: version.created_by,
      username: 'Unknown User',
      avatar_url: null,
    },
  } as ProjectVersionWithCreator;
}

/**
 * Create a new version (snapshot) of the project
 * Captures current state of project + all tracks
 */
export async function createProjectVersion(
  projectId: string,
  userId: string,
  request: CreateProjectVersionRequest
): Promise<ProjectVersion> {
  // 1. Get current project state
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single();

  if (projectError) {
    throw new Error(`Failed to fetch project: ${projectError.message}`);
  }

  // 2. Get all tracks for the project
  const { data: tracks, error: tracksError } = await supabase
    .from('tracks')
    .select('*')
    .eq('project_id', projectId)
    .order('track_number', { ascending: true });

  if (tracksError) {
    throw new Error(`Failed to fetch tracks: ${tracksError.message}`);
  }

  // 3. Get latest version number
  const { data: latestVersion } = await supabase
    .from('project_versions')
    .select('version_number')
    .eq('project_id', projectId)
    .order('version_number', { ascending: false })
    .limit(1)
    .single();

  const nextVersionNumber = latestVersion ? latestVersion.version_number + 1 : 1;

  // 4. Create snapshot data
  const snapshotData: ProjectVersionSnapshot = {
    project: project as Project,
    tracks: (tracks || []) as Track[],
    settings: {
      bpm: project.bpm,
      time_signature: project.time_signature,
      key: project.key,
    },
    metadata: project.metadata || {},
  };

  // 5. Insert new version
  const { data: newVersion, error: insertError } = await supabase
    .from('project_versions')
    .insert({
      project_id: projectId,
      version_number: nextVersionNumber,
      version_tag: request.version_tag || null,
      created_by: userId,
      snapshot_data: snapshotData,
      changes: request.changes || null,
    })
    .select()
    .single();

  if (insertError) {
    console.error('Error creating version:', insertError);
    throw new Error(`Failed to create version: ${insertError.message}`);
  }

  return newVersion as ProjectVersion;
}

/**
 * Restore a project to a specific version
 * WARNING: This overwrites current project state!
 */
export async function restoreProjectVersion(
  versionId: string,
  userId: string
): Promise<void> {
  // 1. Get the version snapshot
  const version = await getProjectVersion(versionId);
  const snapshot = version.snapshot_data as ProjectVersionSnapshot;

  // 2. Update project with snapshot data
  const { error: projectError } = await supabase
    .from('projects')
    .update({
      title: snapshot.project.title,
      description: snapshot.project.description,
      bpm: snapshot.settings.bpm,
      time_signature: snapshot.settings.time_signature,
      key: snapshot.settings.key,
      status: snapshot.project.status,
      metadata: snapshot.metadata,
      updated_at: new Date().toISOString(),
    })
    .eq('id', version.project_id);

  if (projectError) {
    throw new Error(`Failed to restore project: ${projectError.message}`);
  }

  // 3. Delete current tracks
  const { error: deleteError } = await supabase
    .from('tracks')
    .delete()
    .eq('project_id', version.project_id);

  if (deleteError) {
    throw new Error(`Failed to delete tracks: ${deleteError.message}`);
  }

  // 4. Restore tracks from snapshot
  if (snapshot.tracks && snapshot.tracks.length > 0) {
    // Omit id, created_at, updated_at to let Postgres generate new values
    const tracksToInsert = snapshot.tracks.map(({ id, created_at, updated_at, ...track }) => ({
      ...track,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    const { error: tracksError } = await supabase
      .from('tracks')
      .insert(tracksToInsert);

    if (tracksError) {
      throw new Error(`Failed to restore tracks: ${tracksError.message}`);
    }
  }

  // 5. Create a new version to mark this restore point
  await createProjectVersion(
    version.project_id,
    userId,
    {
      version_tag: `Restored from v${version.version_number}`,
      changes: `Restored project to version ${version.version_number}${version.version_tag ? ` (${version.version_tag})` : ''}`,
    }
  );
}

/**
 * Delete a specific version
 * Note: Cannot delete if it's the only version
 */
export async function deleteProjectVersion(
  versionId: string
): Promise<void> {
  // Check if this is the only version
  const { data: version } = await supabase
    .from('project_versions')
    .select('project_id')
    .eq('id', versionId)
    .single();

  if (!version) {
    throw new Error('Version not found');
  }

  const { count } = await supabase
    .from('project_versions')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', version.project_id);

  if (count === 1) {
    throw new Error('Cannot delete the only version of a project');
  }

  // Delete the version
  const { error } = await supabase
    .from('project_versions')
    .delete()
    .eq('id', versionId);

  if (error) {
    console.error('Error deleting version:', error);
    throw new Error(`Failed to delete version: ${error.message}`);
  }
}

/**
 * Compare two versions (returns a diff summary)
 */
export async function compareVersions(
  versionId1: string,
  versionId2: string
): Promise<{
  projectChanges: Record<string, any>;
  tracksAdded: number;
  tracksRemoved: number;
  tracksModified: number;
}> {
  const [version1, version2] = await Promise.all([
    getProjectVersion(versionId1),
    getProjectVersion(versionId2),
  ]);

  const snapshot1 = version1.snapshot_data as ProjectVersionSnapshot;
  const snapshot2 = version2.snapshot_data as ProjectVersionSnapshot;

  // Compare project settings
  const projectChanges: Record<string, any> = {};
  if (snapshot1.project.title !== snapshot2.project.title) {
    projectChanges.title = { from: snapshot1.project.title, to: snapshot2.project.title };
  }
  if (snapshot1.settings.bpm !== snapshot2.settings.bpm) {
    projectChanges.bpm = { from: snapshot1.settings.bpm, to: snapshot2.settings.bpm };
  }
  if (snapshot1.settings.time_signature !== snapshot2.settings.time_signature) {
    projectChanges.time_signature = {
      from: snapshot1.settings.time_signature,
      to: snapshot2.settings.time_signature,
    };
  }

  // Compare tracks
  const tracks1Ids = new Set(snapshot1.tracks.map(t => t.id));
  const tracks2Ids = new Set(snapshot2.tracks.map(t => t.id));

  const tracksAdded = snapshot2.tracks.filter(t => !tracks1Ids.has(t.id)).length;
  const tracksRemoved = snapshot1.tracks.filter(t => !tracks2Ids.has(t.id)).length;
  const tracksModified = snapshot2.tracks.filter(t => {
    if (!tracks1Ids.has(t.id)) return false;
    const oldTrack = snapshot1.tracks.find(t1 => t1.id === t.id);
    return oldTrack && JSON.stringify(oldTrack) !== JSON.stringify(t);
  }).length;

  return {
    projectChanges,
    tracksAdded,
    tracksRemoved,
    tracksModified,
  };
}
