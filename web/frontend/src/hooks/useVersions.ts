// ============================================
// useVersions Hook
// React hook for managing project versions
// ============================================

import { useState, useCallback } from 'react';
import type {
  ProjectVersionWithCreator,
  CreateProjectVersionRequest,
} from '../types/projects';
import {
  getProjectVersions,
  getProjectVersion,
  createProjectVersion,
  restoreProjectVersion,
  deleteProjectVersion,
  compareVersions,
} from '../lib/services/projects/versionsService';
import { useToast } from './useToast';

export function useVersions(projectId: string) {
  const [versions, setVersions] = useState<ProjectVersionWithCreator[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const { success, error: showError } = useToast();

  /**
   * Load all versions for the project
   */
  const loadVersions = useCallback(async () => {
    if (!projectId) return;

    setLoading(true);
    try {
      const data = await getProjectVersions(projectId);
      setVersions(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load versions';
      showError(message);
      console.error('Load versions error:', err);
    } finally {
      setLoading(false);
    }
  }, [projectId, showError]);

  /**
   * Create a new version (snapshot)
   */
  const createVersion = useCallback(async (
    userId: string,
    request: CreateProjectVersionRequest
  ) => {
    if (!projectId) return;

    setCreating(true);
    try {
      const newVersion = await createProjectVersion(projectId, userId, request);
      success(`Version ${newVersion.version_number} created successfully!`);

      // Reload versions
      await loadVersions();

      return newVersion;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create version';

      // Check if it's a RLS permission error
      if (errorMessage.includes('row-level security') || errorMessage.includes('policy')) {
        showError('You need Contributor, Mixer, or Admin role to create versions. Currently you are a Viewer.');
      } else {
        showError(errorMessage);
      }

      console.error('Create version error:', err);
      throw err;
    } finally {
      setCreating(false);
    }
  }, [projectId, success, showError, loadVersions]);

  /**
   * Restore project to a specific version
   */
  const restoreVersion = useCallback(async (
    versionId: string,
    userId: string
  ) => {
    setRestoring(true);
    try {
      await restoreProjectVersion(versionId, userId);
      success('Project restored successfully!');

      // Reload versions to show the new "restore point" version
      await loadVersions();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to restore version';
      showError(message);
      console.error('Restore version error:', err);
      throw err;
    } finally {
      setRestoring(false);
    }
  }, [success, showError, loadVersions]);

  /**
   * Delete a version
   */
  const deleteVersion = useCallback(async (versionId: string) => {
    try {
      await deleteProjectVersion(versionId);
      success('Version deleted successfully!');

      // Remove from local state
      setVersions(prev => prev.filter(v => v.id !== versionId));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete version';
      showError(message);
      console.error('Delete version error:', err);
      throw err;
    }
  }, [success, showError]);

  /**
   * Get a specific version by ID
   */
  const getVersion = useCallback(async (versionId: string) => {
    try {
      return await getProjectVersion(versionId);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load version';
      showError(message);
      console.error('Get version error:', err);
      throw err;
    }
  }, [showError]);

  /**
   * Compare two versions
   */
  const diffVersions = useCallback(async (
    versionId1: string,
    versionId2: string
  ) => {
    try {
      return await compareVersions(versionId1, versionId2);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to compare versions';
      showError(message);
      console.error('Compare versions error:', err);
      throw err;
    }
  }, [showError]);

  return {
    // State
    versions,
    loading,
    creating,
    restoring,

    // Actions
    loadVersions,
    createVersion,
    restoreVersion,
    deleteVersion,
    getVersion,
    diffVersions,
  };
}
