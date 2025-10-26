// ============================================
// ADD TO PROJECT BUTTON
// Allows adding chat/file browser files to projects
// ============================================

import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../hooks/useToast';
import { moveFileFromChatToShared, addFileToProject, createUserFile } from '../../lib/services/files/userFilesService';
import { createTrack } from '../../lib/services/tracks/tracksService';
import { generateWaveform } from '../../lib/audio/audioMetadata';
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
  compact?: boolean;  // Use compact icon-only mode for tables
  currentProjectIds?: string[];  // Projects this file is already in (to filter out)
}

export default function AddToProjectButton({
  messageId,
  chatFilePath,
  userFileId,
  fileName,
  fileType,
  fileSize,
  onSuccess,
  compact = false,
  currentProjectIds = [],
}: AddToProjectButtonProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [projects, setProjects] = useState<Array<{ id: string; title: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const navigate = useNavigate();
  const { success, error: showError } = useToast();

  // Calculate dropdown position when it opens
  useEffect(() => {
    if (showDropdown && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom,
        left: rect.right - 250, // 250px is min-width of dropdown, align to right
      });
    }
  }, [showDropdown]);

  // Fetch user's projects when dropdown opens
  const handleOpenDropdown = async () => {
    console.log('🔵 handleOpenDropdown called, current projects.length:', projects.length);

    if (projects.length === 0) {
      try {
        const { supabase } = await import('../../lib/supabase');
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.log('❌ No user found');
          return;
        }
        console.log('✅ User found:', user.id);

        // Get projects where user is owner
        const { data: ownedProjects, error: ownedError } = await supabase
          .from('projects')
          .select('id, title')
          .eq('creator_id', user.id);

        if (ownedError) {
          console.error('❌ Failed to fetch owned projects:', ownedError);
          throw ownedError;
        }
        console.log('✅ Owned projects:', ownedProjects);

        // Get projects where user is collaborator
        const { data: collabData, error: collabError } = await supabase
          .from('project_collaborators')
          .select('project_id')
          .eq('user_id', user.id);

        if (collabError) {
          console.error('❌ Failed to fetch collaborator projects:', collabError);
          throw collabError;
        }
        console.log('✅ Collaborator data:', collabData);

        // Fetch full project details for collaborator projects
        let collabProjects: Array<{ id: string; title: string }> = [];
        if (collabData && collabData.length > 0) {
          const projectIds = collabData.map(c => c.project_id);
          const { data: projectDetails } = await supabase
            .from('projects')
            .select('id, title')
            .in('id', projectIds);

          collabProjects = projectDetails || [];
          console.log('✅ Collab projects details:', collabProjects);
        }

        // Combine both lists and remove duplicates
        const allProjects = [
          ...(ownedProjects || []),
          ...collabProjects
        ];
        console.log('✅ All projects combined:', allProjects);

        // Remove duplicates by ID
        const uniqueProjects = Array.from(
          new Map(allProjects.map(p => [p.id, p])).values()
        );
        console.log('✅ Unique projects:', uniqueProjects);

        // Filter out projects this file is already in
        const availableProjects = uniqueProjects.filter(
          (project) => !currentProjectIds.includes(project.id)
        );
        console.log('✅ Available projects (after filtering):', availableProjects);
        console.log('   Current project IDs:', currentProjectIds);

        // Sort by title
        availableProjects.sort((a, b) => a.title.localeCompare(b.title));

        setProjects(availableProjects);
        console.log('✅ Projects state set to:', availableProjects);
      } catch (err) {
        console.error('❌ Failed to load projects:', err);
      }
    }

    console.log('🟢 Toggling dropdown, new state will be:', !showDropdown);
    setShowDropdown(!showDropdown);
  };

  // Add file to existing project
  const handleAddToProject = async (projectId: string, projectTitle: string) => {
    setLoading(true);
    setShowDropdown(false);

    try {
      let fileId = userFileId;

      // If from chat, check if already moved or move to shared_files
      if (messageId && chatFilePath && !userFileId) {
        const { supabase } = await import('../../lib/supabase');

        // Check if file already exists in user_files (by source_message_id)
        const { data: existingFile } = await supabase
          .from('user_files')
          .select('id')
          .eq('source_message_id', messageId)
          .maybeSingle();

        if (existingFile) {
          console.log('✅ File already exists in user_files:', existingFile.id);
          fileId = existingFile.id;
        } else {
          console.log('Moving file from chat to shared storage...', { messageId, chatFilePath, fileName, fileType });
          const userFile = await moveFileFromChatToShared(
            messageId,
            chatFilePath,
            fileName,
            fileType
          );

          if (!userFile) {
            console.error('moveFileFromChatToShared returned null');
            throw new Error('Failed to move file to shared storage');
          }

          console.log('File moved successfully:', userFile);
          fileId = userFile.id;
        }
      }

      if (!fileId) {
        console.error('No file ID available after move/check');
        throw new Error('No file ID available');
      }

      // Add file to project (updates source_project_ids array)
      console.log('Adding file to project...', { fileId, projectId, projectTitle });
      const updatedFile = await addFileToProject(fileId, projectId);
      if (!updatedFile) {
        console.error('addFileToProject returned null');
        throw new Error('Failed to add file to project');
      }
      console.log('File added to project successfully:', updatedFile);

      // Check if track already exists in this project (prevent duplicates)
      const { supabase } = await import('../../lib/supabase');
      const { data: existingTrack } = await supabase
        .from('tracks')
        .select('id')
        .eq('project_id', projectId)
        .eq('user_file_id', fileId)
        .maybeSingle();

      if (existingTrack) {
        showError(`"${fileName}" is already in "${projectTitle}"! ⚠️`);
        return;
      }

      // Get next track number
      const { data: tracks } = await supabase
        .from('tracks')
        .select('track_number')
        .eq('project_id', projectId)
        .order('track_number', { ascending: false })
        .limit(1);

      const nextTrackNumber = (tracks?.[0]?.track_number || 0) + 1;

      // Get waveform data from user_file metadata (if exists)
      let waveformData = updatedFile.metadata?.waveform || null;
      const durationMs = updatedFile.duration_ms || null;
      const bpm = updatedFile.metadata?.bpm || null;
      const sampleRate = updatedFile.metadata?.sampleRate || null;
      const channels = updatedFile.metadata?.channels || null;

      // If no waveform data exists, generate it from the audio file
      if (!waveformData && fileType.startsWith('audio/')) {
        try {
          console.log('🎵 No waveform found, generating from audio file...');

          // Get signed URL for the file
          const { data: signedUrlData } = await supabase.storage
            .from('shared_files')
            .createSignedUrl(updatedFile.file_path, 60); // 1 minute expiry

          if (signedUrlData?.signedUrl) {
            // Fetch audio file as blob
            const response = await fetch(signedUrlData.signedUrl);
            const blob = await response.blob();

            // Generate waveform
            waveformData = await generateWaveform(blob, 1000);
            console.log('✅ Waveform generated:', waveformData.length, 'points');
          }
        } catch (err) {
          console.warn('⚠️ Failed to generate waveform:', err);
          // Continue without waveform
        }
      }

      console.log('📊 Track metadata:', { waveformData: !!waveformData, durationMs, bpm, sampleRate, channels });

      // Create new track
      await createTrack({
        project_id: projectId,
        name: fileName,
        track_type: 'audio',
        track_number: nextTrackNumber,
        file_path: updatedFile.file_path,
        user_file_id: fileId,
        file_size: fileSize,
        duration_ms: durationMs,
        waveform_data: waveformData,
        bpm: bpm,
        sample_rate: sampleRate,
        channels: channels,
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
      {compact ? (
        <button
          ref={buttonRef}
          className="table-action-btn"
          onClick={handleOpenDropdown}
          disabled={loading}
          title="Zu Projekt hinzufügen"
        >
          {loading ? '⏳' : '➕'}
        </button>
      ) : (
        <Button
          variant="primary"
          size="small"
          onClick={handleOpenDropdown}
          disabled={loading}
        >
          {loading ? 'Adding...' : '➕ Add to Project'}
        </Button>
      )}

      {showDropdown && (
        <>
          {/* Backdrop */}
          <div
            className="dropdown-backdrop"
            onClick={() => setShowDropdown(false)}
          />

          {/* Dropdown Menu */}
          <div
            className="dropdown-menu"
            style={{
              top: `${dropdownPosition.top}px`,
              left: `${dropdownPosition.left}px`,
            }}
          >
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
