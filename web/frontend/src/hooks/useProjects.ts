// ============================================
// useProjects HOOK
// React hook for managing projects
// ============================================

import { useState, useEffect, useCallback } from 'react';
import { useToast } from './useToast';
import {
  getProjects,
  getMyProjects,
  getCollaboratedProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  subscribeToProject,
} from '../lib/services/projects/projectsService';
import type {
  Project,
  ProjectWithCreator,
  CreateProjectRequest,
  UpdateProjectRequest,
  ProjectsQueryOptions,
} from '../types/projects';

export function useProjects(options?: ProjectsQueryOptions) {
  const [projects, setProjects] = useState<ProjectWithCreator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { success, error: showError } = useToast();

  // Fetch projects
  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getProjects(options);
      setProjects(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch projects';
      setError(message);
      showError(message);
    } finally {
      setLoading(false);
    }
  }, [options, showError]);

  // Fetch my projects (owned)
  const fetchMyProjects = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getMyProjects();
      setProjects(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch my projects';
      setError(message);
      showError(message);
    } finally {
      setLoading(false);
    }
  }, [showError]);

  // Fetch collaborated projects
  const fetchCollaboratedProjects = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getCollaboratedProjects();
      setProjects(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch collaborated projects';
      setError(message);
      showError(message);
    } finally {
      setLoading(false);
    }
  }, [showError]);

  // Create project
  const create = useCallback(async (data: CreateProjectRequest): Promise<Project | null> => {
    try {
      const project = await createProject(data);

      if (project) {
        success('Project created successfully! 🎵');
        // Refresh list
        await fetchProjects();
      } else {
        showError('Failed to create project');
      }

      return project;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create project';
      showError(message);
      return null;
    }
  }, [fetchProjects, success, showError]);

  // Update project
  const update = useCallback(async (
    projectId: string,
    updates: UpdateProjectRequest
  ): Promise<Project | null> => {
    try {
      const project = await updateProject(projectId, updates);

      if (project) {
        success('Project updated! ✅');
        // Update local state
        setProjects(prev =>
          prev.map(p => (p.id === projectId ? { ...p, ...project } : p))
        );
      } else {
        showError('Failed to update project');
      }

      return project;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update project';
      showError(message);
      return null;
    }
  }, [success, showError]);

  // Delete project
  const remove = useCallback(async (projectId: string): Promise<boolean> => {
    try {
      const deleted = await deleteProject(projectId);

      if (deleted) {
        success('Project deleted 🗑️');
        // Remove from local state
        setProjects(prev => prev.filter(p => p.id !== projectId));
      } else {
        showError('Failed to delete project');
      }

      return deleted;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete project';
      showError(message);
      return false;
    }
  }, [success, showError]);

  // Refresh projects list
  const refresh = useCallback(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Initial fetch
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  return {
    projects,
    loading,
    error,
    create,
    update,
    remove,
    refresh,
    fetchMyProjects,
    fetchCollaboratedProjects,
  };
}

// ============================================
// useProject - Single Project Hook
// ============================================

export function useProject(projectId: string | null) {
  const [project, setProject] = useState<ProjectWithCreator | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { error: showError } = useToast();

  // Fetch single project
  const fetchProject = useCallback(async () => {
    if (!projectId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await getProject(projectId);
      setProject(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch project';
      setError(message);
      showError(message);
    } finally {
      setLoading(false);
    }
  }, [projectId, showError]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!projectId) return;

    const unsubscribe = subscribeToProject(projectId, (updatedProject) => {
      setProject(prev => {
        if (!prev) return null;
        return { ...prev, ...updatedProject };
      });
    });

    return unsubscribe;
  }, [projectId]);

  // Initial fetch
  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  return {
    project,
    loading,
    error,
    refresh: fetchProject,
  };
}
