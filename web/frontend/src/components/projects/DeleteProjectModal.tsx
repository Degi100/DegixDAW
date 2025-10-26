// ============================================
// DELETE PROJECT MODAL
// Ownership-aware project deletion with track handling
// ============================================

import { useState, useEffect } from 'react';
import { getProjectFilesGrouped, removeFileFromProject, deleteUserFile } from '../../lib/services/files/userFilesService';
import Button from '../ui/Button';
import type { UserFile } from '../../types/userFiles';
import '../../styles/components/projects/_delete-project-modal.scss';

interface DeleteProjectModalProps {
  projectId: string;
  projectTitle: string;
  currentUserId: string;
  onConfirm: (deleteMyTracks: boolean) => Promise<void>;
  onCancel: () => void;
}

export default function DeleteProjectModal({
  projectId,
  projectTitle,
  currentUserId,
  onConfirm,
  onCancel,
}: DeleteProjectModalProps) {
  const [loading, setLoading] = useState(true);
  const [myTracks, setMyTracks] = useState<UserFile[]>([]);
  const [otherTracks, setOtherTracks] = useState<UserFile[]>([]);
  const [deleteMyTracks, setDeleteMyTracks] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadProjectTracks();
  }, [projectId]);

  const loadProjectTracks = async () => {
    try {
      const { ownedByMe, ownedByOthers } = await getProjectFilesGrouped(projectId, currentUserId);
      setMyTracks(ownedByMe);
      setOtherTracks(ownedByOthers);
    } catch (error) {
      console.error('Failed to load project tracks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    setDeleting(true);

    try {
      // Handle MY tracks first
      if (deleteMyTracks) {
        // Delete my tracks completely
        await Promise.all(myTracks.map((track) => deleteUserFile(track.id)));
      } else {
        // Move my tracks to "Meine" (remove from project)
        await Promise.all(myTracks.map((track) => removeFileFromProject(track.id, projectId)));
      }

      // Handle OTHER people's tracks (always return to owner)
      await Promise.all(otherTracks.map((track) => removeFileFromProject(track.id, projectId)));

      // Call parent's delete function (deletes project + track entries)
      await onConfirm(deleteMyTracks);
    } catch (error) {
      console.error('Delete project failed:', error);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="modal-overlay">
        <div className="modal-content delete-project-modal">
          <div className="modal-loading">
            <div className="spinner"></div>
            <p>Loading project files...</p>
          </div>
        </div>
      </div>
    );
  }

  const totalTracks = myTracks.length + otherTracks.length;
  const hasMyTracks = myTracks.length > 0;
  const hasOtherTracks = otherTracks.length > 0;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content delete-project-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <h2>⚠️ Delete Project?</h2>
          <button className="modal-close" onClick={onCancel}>
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          <div className="warning-box">
            <strong>"{projectTitle}"</strong>
            {totalTracks > 0 && (
              <span> contains {totalTracks} file{totalTracks !== 1 ? 's' : ''}</span>
            )}
          </div>

          {/* MY Tracks Section */}
          {hasMyTracks && (
            <div className="tracks-section my-tracks-section">
              <h3>Your Files ({myTracks.length})</h3>
              <div className="tracks-list">
                {myTracks.map((track) => (
                  <div key={track.id} className="track-item">
                    <span className="track-icon">🎵</span>
                    <span className="track-name">{track.file_name}</span>
                  </div>
                ))}
              </div>

              <div className="choice-box">
                <p className="choice-label">What should happen to YOUR files?</p>
                <div className="choice-options">
                  <label className="choice-option">
                    <input
                      type="radio"
                      name="myTracks"
                      checked={!deleteMyTracks}
                      onChange={() => setDeleteMyTracks(false)}
                    />
                    <div className="option-content">
                      <span className="option-icon">📁</span>
                      <div className="option-text">
                        <strong>Move to "Meine Dateien"</strong>
                        <small>Files will be returned to your File Browser</small>
                      </div>
                    </div>
                  </label>

                  <label className="choice-option danger">
                    <input
                      type="radio"
                      name="myTracks"
                      checked={deleteMyTracks}
                      onChange={() => setDeleteMyTracks(true)}
                    />
                    <div className="option-content">
                      <span className="option-icon">🗑️</span>
                      <div className="option-text">
                        <strong>Delete files permanently</strong>
                        <small>⚠️ Cannot be undone!</small>
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* DIVIDER */}
          {hasMyTracks && hasOtherTracks && <div className="section-divider" />}

          {/* OTHER TRACKS Section */}
          {hasOtherTracks && (
            <div className="tracks-section other-tracks-section">
              <h3>Collaborator Files ({otherTracks.length})</h3>
              <div className="tracks-list">
                {otherTracks.map((track) => (
                  <div key={track.id} className="track-item">
                    <span className="track-icon">🎵</span>
                    <span className="track-name">{track.file_name}</span>
                    {track.uploader && (
                      <span className="track-owner">by {track.uploader.username}</span>
                    )}
                  </div>
                ))}
              </div>

              <div className="info-box">
                <span className="info-icon">ℹ️</span>
                <p>
                  These files will be <strong>returned to their owners</strong> automatically.
                </p>
              </div>
            </div>
          )}

          {/* NO TRACKS */}
          {!hasMyTracks && !hasOtherTracks && (
            <div className="info-box">
              <span className="info-icon">ℹ️</span>
              <p>This project has no files. Only project settings will be deleted.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <Button variant="secondary" onClick={onCancel} disabled={deleting}>
            Cancel
          </Button>
          <Button
            variant="error"
            onClick={handleConfirm}
            disabled={deleting}
          >
            {deleting ? 'Deleting...' : `Delete Project${hasMyTracks && deleteMyTracks ? ' & Files' : ''}`}
          </Button>
        </div>
      </div>
    </div>
  );
}
