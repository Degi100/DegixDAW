// ============================================
// USE USER FILES HOOK
// State management for File Browser
// ============================================

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { getUserFiles, deleteUserFile } from '../lib/services/files/userFilesService';
import type { UserFile } from '../types/userFiles';

export type FileFilter = 'all' | 'received' | 'sent' | 'mine' | 'projects';

export interface GroupedFiles {
  [projectId: string]: {
    projectTitle: string;
    files: UserFile[];
  };
}

export interface UseUserFilesReturn {
  // State
  files: UserFile[];
  filteredFiles: UserFile[];
  groupedFiles: GroupedFiles | null;
  loading: boolean;
  error: string | null;

  // Filter
  filter: FileFilter;
  setFilter: (filter: FileFilter) => void;

  // Grouping
  groupByProject: boolean;
  setGroupByProject: (group: boolean) => void;

  // Actions
  refresh: () => Promise<void>;
  deleteFile: (fileId: string) => Promise<boolean>;
}

export function useUserFiles(userId?: string): UseUserFilesReturn {
  // State
  const [files, setFiles] = useState<UserFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FileFilter>('all');
  const [groupByProject, setGroupByProject] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Get current user ID
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };

    if (!userId) {
      getCurrentUser();
    } else {
      setCurrentUserId(userId);
    }
  }, [userId]);

  // Load files
  const loadFiles = useCallback(async () => {
    if (!currentUserId) return;

    setLoading(true);
    setError(null);

    try {
      const userFiles = await getUserFiles(currentUserId);
      setFiles(userFiles);
    } catch (err) {
      console.error('Failed to load user files:', err);
      setError(err instanceof Error ? err.message : 'Failed to load files');
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  // Store loadFiles in ref to avoid stale closures
  const loadFilesRef = useRef(loadFiles);
  useEffect(() => {
    loadFilesRef.current = loadFiles;
  }, [loadFiles]);

  // Initial load
  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  // Realtime subscription (user_files AND tracks changes)
  useEffect(() => {
    if (!currentUserId) return;

    const channel = supabase
      .channel(`user-files:${currentUserId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_files',
          filter: `user_id=eq.${currentUserId}`,
        },
        () => {
          loadFilesRef.current();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tracks',
        },
        () => {
          loadFilesRef.current();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId]);

  // Filter files based on current filter
  const filteredFiles = useCallback(() => {
    if (!currentUserId) return [];

    switch (filter) {
      case 'all':
        return files;

      case 'received':
        // Files from messages where I'm NOT the uploader
        return files.filter(
          (f) => f.source === 'chat' && f.uploaded_by !== currentUserId
        );

      case 'sent':
        // Files I uploaded to chat
        return files.filter(
          (f) => f.source === 'chat' && f.uploaded_by === currentUserId
        );

      case 'mine':
        // Files I uploaded (not in projects, or direct uploads)
        return files.filter(
          (f) => f.uploaded_by === currentUserId && (!f.source_project_ids || f.source_project_ids.length === 0)
        );

      case 'projects':
        // Files that are in at least one project
        return files.filter(
          (f) => f.source_project_ids && f.source_project_ids.length > 0
        );

      default:
        return files;
    }
  }, [files, filter, currentUserId])();

  // Group files by project (for "all" filter)
  const groupedFiles = useCallback((): GroupedFiles | null => {
    if (!groupByProject || filter !== 'all') return null;

    const groups: GroupedFiles = {};

    filteredFiles.forEach((file) => {
      if (file.source_project_ids && file.source_project_ids.length > 0) {
        file.source_project_ids.forEach((projectId) => {
          if (!groups[projectId]) {
            groups[projectId] = {
              projectTitle: `Project ${projectId.slice(0, 8)}...`, // TODO: Fetch real project title
              files: [],
            };
          }
          groups[projectId].files.push(file);
        });
      } else {
        // Files not in projects → "Uncategorized"
        if (!groups['uncategorized']) {
          groups['uncategorized'] = {
            projectTitle: 'Uncategorized',
            files: [],
          };
        }
        groups['uncategorized'].files.push(file);
      }
    });

    return groups;
  }, [filteredFiles, groupByProject, filter])();

  // Delete file
  const handleDeleteFile = async (fileId: string): Promise<boolean> => {
    try {
      const success = await deleteUserFile(fileId);
      if (success) {
        // Remove from local state
        setFiles((prev) => prev.filter((f) => f.id !== fileId));
      }
      return success;
    } catch (err) {
      console.error('Failed to delete file:', err);
      return false;
    }
  };

  return {
    // State
    files,
    filteredFiles,
    groupedFiles,
    loading,
    error,

    // Filter
    filter,
    setFilter,

    // Grouping
    groupByProject,
    setGroupByProject,

    // Actions
    refresh: loadFiles,
    deleteFile: handleDeleteFile,
  };
}
