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

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { project, loading, error } = useProject(id || null);
  const { tracks, uploading, upload } = useTracks(id || null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    if (!id) {
      navigate('/projects');
    }
  }, [id, navigate]);

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
            icon="←"
          >
            Back
          </Button>

          <div className="header-actions">
            <span className="project-status" data-status={project.status}>
              {project.status}
            </span>
            <Button variant="secondary" icon="⚙️">
              Settings
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
          /* Track List - TODO: Create TrackList component */
          <div className="tracks-list">
            <h3>Tracks ({tracks.length})</h3>
            {tracks.map((track) => (
              <div key={track.id} className="track-item">
                <span>{track.track_number}. {track.name}</span>
                <span>{track.duration_ms ? `${Math.round(track.duration_ms / 1000)}s` : 'N/A'}</span>
              </div>
            ))}
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
