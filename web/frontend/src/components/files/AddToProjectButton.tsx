// ============================================
// ADD TO PROJECT BUTTON
// Allows adding chat/file browser files to projects
// ============================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../hooks/useToast';
import { moveFileFromChatToShared, addFileToProject, createUserFile } from '../../lib/services/files/userFilesService';
import { createTrack } from '../../lib/services/tracks/tracksService';
import Button from '../ui/Button';
import '../../../src/styles/components/files/_add-to-project-button.scss';

interface AddToProjectButtonProps {
  messageId?: string;  // If from chat
  chatFilePath?: string;  // message-attachments path
  userFileId?: string;  // If already in user_files
  fileName: string;
  fileType: string;
  fileSize?: number;
  onSuccess?: () => void;
}

export default function AddToProjectButton({
  messageId,
  chatFilePath,
  userFileId,
  fileName,
  fileType,
  fileSize,
  onSuccess,
}: AddToProjectButtonProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [projects, setProjects] = useState<Array<{ id: string; title: string }>>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { success, error: showError } = useToast();

  // Fetch user's projects when dropdown opens
  const handleOpenDropdown = async () => {
    if (projects.length === 0) {
      try {
        const { supabase } = await import('../../lib/supabase');
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Get projects where user is owner or collaborator
        const { data } = await supabase
          .from('projects')
          .select('id, title')
          .or(`creator_id.eq.${user.id},id.in.(select project_id from project_collaborators where user_id=${user.id})`)
          .order('title');

        setProjects(data || []);
      } catch (err) {
        console.error('Failed to load projects:', err);
      }
    }
    setShowDropdown(!showDropdown);
  };

  // Add file to existing project
  const handleAddToProject = async (projectId: string, projectTitle: string) => {
    setLoading(true);
    setShowDropdown(false);

    try {
      let fileId = userFileId;

      // If from chat, first move to shared_files
      if (messageId && chatFilePath && !userFileId) {
        const userFile = await moveFileFromChatToShared(
          messageId,
          chatFilePath,
          fileName,
          fileType
        );

        if (!userFile) {
          throw new Error('Failed to move file to shared storage');
        }

        fileId = userFile.id;
      }

      if (!fileId) {
        throw new Error('No file ID available');
      }

      // Add file to project (updates source_project_ids array)
      const updatedFile = await addFileToProject(fileId, projectId);
      if (!updatedFile) {
        throw new Error('Failed to add file to project');
      }

      // Create track entry in project
      const { supabase } = await import('../../lib/supabase');
      const { data: existingTracks } = await supabase
        .from('tracks')
        .select('track_number')
        .eq('project_id', projectId)
        .order('track_number', { ascending: false })
        .limit(1);

      const nextTrackNumber = (existingTracks?.[0]?.track_number || 0) + 1;

      await createTrack({
        project_id: projectId,
        name: fileName,
        track_type: 'audio',
        track_number: nextTrackNumber,
        file_path: updatedFile.file_path,
        user_file_id: fileId,
        file_size: fileSize,
      });

      success(`Added "${fileName}" to "${projectTitle}"! 🎵`);
      onSuccess?.();
    } catch (err) {
      console.error('Add to project failed:', err);
      showError(err instanceof Error ? err.message : 'Failed to add file to project');
    } finally {
      setLoading(false);
    }
  };

  // Create new project with this file
  const handleCreateNewProject = () => {
    setShowDropdown(false);
    // TODO: Open CreateProjectModal with pre-filled file
    showError('Create new project feature coming soon!');
  };

  // Only show for audio files
  if (!fileType.startsWith('audio/')) {
    return null;
  }

  return (
    <div className="add-to-project-button">
      <Button
        variant="primary"
        size="small"
        onClick={handleOpenDropdown}
        disabled={loading}
      >
        {loading ? 'Adding...' : '➕ Add to Project'}
      </Button>

      {showDropdown && (
        <>
          {/* Backdrop */}
          <div
            className="dropdown-backdrop"
            onClick={() => setShowDropdown(false)}
          />

          {/* Dropdown Menu */}
          <div className="dropdown-menu">
            <div className="dropdown-header">
              Add to Project
            </div>

            {projects.length === 0 ? (
              <div className="dropdown-empty">
                <p>No projects yet</p>
                <button
                  className="dropdown-item"
                  onClick={handleCreateNewProject}
                >
                  ➕ Create First Project
                </button>
              </div>
            ) : (
              <>
                <div className="dropdown-list">
                  {projects.map((project) => (
                    <button
                      key={project.id}
                      className="dropdown-item"
                      onClick={() => handleAddToProject(project.id, project.title)}
                    >
                      📁 {project.title}
                    </button>
                  ))}
                </div>

                <div className="dropdown-divider" />

                <button
                  className="dropdown-item create-new"
                  onClick={handleCreateNewProject}
                >
                  ➕ Create New Project
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
