// ============================================
// PROJECT DETAIL PAGE
// View and manage a single project
// ============================================

import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProject } from '../../hooks/useProjects';
import Button from '../../components/ui/Button';

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { project, loading, error } = useProject(id || null);

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
        {/* Empty State - Track Upload will come in Week 3-4 */}
        <div className="empty-tracks">
          <div className="empty-icon">🎵</div>
          <h3>No Tracks Yet</h3>
          <p>Start building your project by uploading audio files or recording tracks.</p>
          <div className="empty-actions">
            <Button variant="primary" icon="📤">
              Upload Track
            </Button>
            <Button variant="secondary" icon="🎤">
              Record Track
            </Button>
          </div>
          <div className="coming-soon-notice">
            <span className="notice-icon">🚧</span>
            <span>Track upload coming in Week 3-4 (Phase 1 Roadmap)</span>
          </div>
        </div>
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
