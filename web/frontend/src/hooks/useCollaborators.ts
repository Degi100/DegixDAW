// ============================================
// USE COLLABORATORS HOOK
// React hook for managing project collaborators
// ============================================

import { useState, useEffect, useCallback } from 'react';
import {
  getProjectCollaborators,
  inviteCollaborator,
  removeCollaborator,
  updateCollaboratorPermissions,
  acceptInvite,
  getUserIdByEmail,
  type InviteCollaboratorData,
} from '../lib/services/projects/collaboratorsService';
import type { ProjectCollaborator } from '../types/projects';

export function useCollaborators(projectId: string) {
  const [collaborators, setCollaborators] = useState<ProjectCollaborator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch collaborators
  const fetchCollaborators = useCallback(async () => {
    if (!projectId) return;

    setLoading(true);
    setError(null);

    try {
      const data = await getProjectCollaborators(projectId);
      setCollaborators(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load collaborators');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchCollaborators();
  }, [fetchCollaborators]);

  // Invite collaborator by email
  const inviteByEmail = useCallback(
    async (email: string, inviteData: Omit<InviteCollaboratorData, 'user_id'>) => {
      try {
        // Lookup user_id by email
        const userId = await getUserIdByEmail(email);
        if (!userId) {
          throw new Error('User not found with that email');
        }

        // Send invite
        const collaborator = await inviteCollaborator(projectId, {
          ...inviteData,
          user_id: userId,
        });

        if (collaborator) {
          setCollaborators((prev) => [...prev, collaborator]);
        }

        return collaborator;
      } catch (err) {
        throw err;
      }
    },
    [projectId]
  );

  // Remove collaborator
  const remove = useCallback(async (collaboratorId: string) => {
    const success = await removeCollaborator(collaboratorId);
    if (success) {
      setCollaborators((prev) => prev.filter((c) => c.id !== collaboratorId));
    }
    return success;
  }, []);

  // Update permissions
  const updatePermissions = useCallback(
    async (collaboratorId: string, updates: Partial<ProjectCollaborator>) => {
      const updated = await updateCollaboratorPermissions(collaboratorId, updates);
      if (updated) {
        setCollaborators((prev) =>
          prev.map((c) => (c.id === collaboratorId ? { ...c, ...updates } : c))
        );
      }
      return updated;
    },
    []
  );

  // Accept invite
  const accept = useCallback(async (collaboratorId: string) => {
    const success = await acceptInvite(collaboratorId);
    if (success) {
      setCollaborators((prev) =>
        prev.map((c) =>
          c.id === collaboratorId ? { ...c, accepted_at: new Date().toISOString() } : c
        )
      );
    }
    return success;
  }, []);

  return {
    collaborators,
    loading,
    error,
    refresh: fetchCollaborators,
    inviteByEmail,
    remove,
    updatePermissions,
    accept,
  };
}
