// ============================================
// PROJECT DETAIL PAGE
// View and manage a single project
// ============================================

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProject } from '../../hooks/useProjects';
import { useTracks } from '../../hooks/useTracks';
import Button from '../../components/ui/Button';
import TrackUploadZone from '../../components/tracks/TrackUploadZone';
import AudioPlayer from '../../components/audio/AudioPlayer';

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { project, loading, error } = useProject(id || null);
  const { tracks, uploading, upload, remove } = useTracks(id || null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedTrackIds, setSelectedTrackIds] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (!id) {
      navigate('/projects');
    }
  }, [id, navigate]);

  // ============================================
  // Track Selection Handlers
  // ============================================

  const toggleTrackSelection = (trackId: string) => {
    setSelectedTrackIds((prev) => {
      const next = new Set(prev);
      if (next.has(trackId)) {
        next.delete(trackId);
      } else {
        next.add(trackId);
      }
      return next;
    });
  };

  const selectAllTracks = () => {
    setSelectedTrackIds(new Set(tracks.map((t) => t.id)));
  };

  const deselectAllTracks = () => {
    setSelectedTrackIds(new Set());
  };

  const handleDeleteSelected = async () => {
    for (const trackId of selectedTrackIds) {
      await remove(trackId);
    }
    setSelectedTrackIds(new Set());
    setShowDeleteConfirm(false);
  };

  if (loading) {
    return (
      <div className="project-detail-page loading">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading project...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="project-detail-page error">
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <h2>Project Not Found</h2>
          <p>The project you're looking for doesn't exist or you don't have access to it.</p>
          <Button onClick={() => navigate('/projects')}>
            Back to Projects
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="project-detail-page">
      {/* Header */}
      <div className="project-header">
        <div className="header-top">
          <Button
            variant="secondary"
            onClick={() => navigate('/projects')}
          >
            ← Back
          </Button>

          <div className="header-actions">
            <span className="project-status" data-status={project.status}>
              {project.status}
            </span>
            <Button variant="secondary">
              ⚙️ Settings
            </Button>
          </div>
        </div>

        <div className="header-main">
          <h1>{project.title}</h1>
          {project.description && (
            <p className="project-description">{project.description}</p>
          )}

          <div className="project-metadata">
            <div className="metadata-item">
              <span className="icon">🎹</span>
              <span className="label">Key:</span>
              <span className="value">{project.key || 'Not set'}</span>
            </div>
            <div className="metadata-item">
              <span className="icon">⏱️</span>
              <span className="label">BPM:</span>
              <span className="value">{project.bpm}</span>
            </div>
            <div className="metadata-item">
              <span className="icon">🎼</span>
              <span className="label">Time Signature:</span>
              <span className="value">{project.time_signature}</span>
            </div>
            <div className="metadata-item">
              <span className="icon">{project.is_public ? '🌍' : '🔒'}</span>
              <span className="label">Visibility:</span>
              <span className="value">{project.is_public ? 'Public' : 'Private'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="project-content">
        {tracks.length === 0 ? (
          /* Empty State with Upload Zone */
          <div className="empty-tracks">
            <div className="empty-icon">🎵</div>
            <h3>No Tracks Yet</h3>
            <p>Start building your project by uploading audio files.</p>

            <TrackUploadZone
              projectId={project.id}
              onUploadStart={(file) => setSelectedFile(file)}
              onUploadComplete={async () => {
                if (selectedFile && id) {
                  await upload(selectedFile);
                  setSelectedFile(null);
                }
              }}
              onUploadError={(error) => {
                console.error('Upload error:', error);
                setSelectedFile(null);
              }}
              disabled={uploading}
            />

            {uploading && (
              <div className="upload-status">
                <div className="upload-spinner"></div>
                <p>Uploading track...</p>
              </div>
            )}
          </div>
        ) : (
          /* Track List with Audio Players */
          <div className="tracks-section">
            <div className="tracks-header">
              <h2>Tracks ({tracks.length})</h2>
              <div className="tracks-header-actions">
                {selectedTrackIds.size > 0 && (
                  <span className="selection-count">
                    {selectedTrackIds.size} selected
                  </span>
                )}
                <Button
                  variant="secondary"
                  onClick={() => setShowUploadModal(true)}
                >
                  ➕ Add Track
                </Button>
              </div>
            </div>

            {/* Bulk Action Bar */}
            {selectedTrackIds.size > 0 && (
              <div className="bulk-action-bar">
                <div className="bulk-info">
                  <button className="btn-link" onClick={deselectAllTracks}>
                    Deselect All
                  </button>
                  {selectedTrackIds.size < tracks.length && (
                    <button className="btn-link" onClick={selectAllTracks}>
                      Select All ({tracks.length})
                    </button>
                  )}
                </div>
                <div className="bulk-actions">
                  <Button
                    variant="error"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    🗑️ Delete ({selectedTrackIds.size})
                  </Button>
                </div>
              </div>
            )}

            <div className="tracks-grid">
              {tracks.map((track) => (
                <div
                  key={track.id}
                  className={`track-card ${selectedTrackIds.has(track.id) ? 'selected' : ''}`}
                >
                  <div className="track-card-header">
                    <div className="track-header-left">
                      <input
                        type="checkbox"
                        className="track-checkbox"
                        checked={selectedTrackIds.has(track.id)}
                        onChange={() => toggleTrackSelection(track.id)}
                      />
                      <div className="track-number">#{track.track_number}</div>
                    </div>
                    <div className="track-actions">
                      <button
                        className="track-action-btn"
                        title="Track settings"
                      >
                        ⚙️
                      </button>
                    </div>
                  </div>

                  <AudioPlayer track={track} />
                </div>
              ))}
            </div>

          </div>
        )}

        {/* Upload Modal */}
        {showUploadModal && (
          <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
            <div className="modal-content track-upload-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Upload Track</h2>
                <button className="modal-close" onClick={() => setShowUploadModal(false)}>
                  ✕
                </button>
              </div>

              <div className="modal-body">
                <TrackUploadZone
                  projectId={project.id}
                  onUploadStart={(file) => setSelectedFile(file)}
                  onUploadComplete={async () => {
                    if (selectedFile && id) {
                      await upload(selectedFile);
                      setSelectedFile(null);
                      setShowUploadModal(false);
                    }
                  }}
                  onUploadError={(error) => {
                    console.error('Upload error:', error);
                    setSelectedFile(null);
                  }}
                  disabled={uploading}
                />

                {uploading && (
                  <div className="upload-status">
                    <div className="upload-spinner"></div>
                    <p>Uploading track...</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
            <div className="modal-content delete-confirm-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Delete Tracks?</h2>
                <button className="modal-close" onClick={() => setShowDeleteConfirm(false)}>
                  ✕
                </button>
              </div>

              <div className="modal-body">
                <p className="warning-text">
                  Are you sure you want to delete <strong>{selectedTrackIds.size}</strong> track(s)?
                  This action cannot be undone.
                </p>

                <div className="modal-actions">
                  <Button
                    variant="secondary"
                    onClick={() => setShowDeleteConfirm(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="error"
                    onClick={handleDeleteSelected}
                  >
                    Delete {selectedTrackIds.size} Track(s)
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Project Info Sidebar */}
      <aside className="project-sidebar">
        <div className="sidebar-section">
          <h3>Project Info</h3>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">Created</span>
              <span className="info-value">
                {new Date(project.created_at).toLocaleDateString()}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">Last Updated</span>
              <span className="info-value">
                {new Date(project.updated_at).toLocaleDateString()}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">Version</span>
              <span className="info-value">v{project.version}</span>
            </div>
          </div>
        </div>

        <div className="sidebar-section">
          <h3>Quick Actions</h3>
          <div className="quick-actions">
            <button className="action-button" disabled>
              <span className="action-icon">👥</span>
              <span className="action-label">Invite Collaborators</span>
            </button>
            <button className="action-button" disabled>
              <span className="action-icon">📥</span>
              <span className="action-label">Download Project</span>
            </button>
            <button className="action-button" disabled>
              <span className="action-icon">📋</span>
              <span className="action-label">Duplicate Project</span>
            </button>
          </div>
          <div className="coming-soon-notice small">
            <span>Coming in Week 5-6</span>
          </div>
        </div>
      </aside>
    </div>
  );
}
