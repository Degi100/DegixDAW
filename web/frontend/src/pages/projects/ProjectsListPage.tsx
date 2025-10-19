// ============================================
// PROJECTS LIST PAGE
// Overview page showing user's projects
// ============================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjects } from '../../hooks/useProjects';
import ProjectCreateModal from '../../components/projects/ProjectCreateModal';
import Button from '../../components/ui/Button';

export default function ProjectsListPage() {
  const navigate = useNavigate();
  const { projects, loading, fetchMyProjects, fetchCollaboratedProjects, remove } = useProjects();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'owned' | 'collaborated'>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Filter projects based on active tab
  const handleTabChange = async (tab: typeof activeTab) => {
    setActiveTab(tab);

    if (tab === 'owned') {
      await fetchMyProjects();
    } else if (tab === 'collaborated') {
      await fetchCollaboratedProjects();
    }
    // 'all' is default behavior
  };


  // Delete project with confirmation
  const handleDeleteProject = async (e: React.MouseEvent, projectId: string, projectTitle: string) => {
    e.stopPropagation(); // Don't navigate to project detail

    if (!window.confirm(`🗑️ Delete project "${projectTitle}"?\n\nThis will delete ALL tracks, comments, and collaborators!\n\nThis action CANNOT be undone!`)) {
      return;
    }

    setDeletingId(projectId);
    await remove(projectId);
    setDeletingId(null);
  };
  return (
    <div className="projects-list-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>🎵 My Projects</h1>
          <p className="page-subtitle">Create and manage your music projects</p>
        </div>
        <Button
          variant="primary"
          onClick={() => setIsCreateModalOpen(true)}
        >
          + New Project
        </Button>
      </div>

      {/* Tabs */}
      <div className="projects-tabs">
        <button
          className={`tab ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => handleTabChange('all')}
        >
          All Projects
        </button>
        <button
          className={`tab ${activeTab === 'owned' ? 'active' : ''}`}
          onClick={() => handleTabChange('owned')}
        >
          My Projects
        </button>
        <button
          className={`tab ${activeTab === 'collaborated' ? 'active' : ''}`}
          onClick={() => handleTabChange('collaborated')}
        >
          Collaborations
        </button>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading projects...</p>
        </div>
      ) : projects.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🎵</div>
          <h3>No projects yet</h3>
          <p>
            {activeTab === 'all' && 'Start creating your first music project'}
            {activeTab === 'owned' && "You haven't created any projects yet"}
            {activeTab === 'collaborated' && "You haven't been invited to any projects yet"}
          </p>
          {activeTab !== 'collaborated' && (
            <Button
              variant="primary"
              onClick={() => setIsCreateModalOpen(true)}
            >
              Create First Project
            </Button>
          )}
        </div>
      ) : (
        <div className="projects-grid">
          {projects.map((project) => (
            <article
              key={project.id}
              className="project-card"
              onClick={() => navigate(`/projects/${project.id}`)}
            >
              {/* Cover Image */}
              <div className="project-cover">
                {project.cover_image_url ? (
                  <img src={project.cover_image_url} alt={project.title} />
                ) : (
                  <div className="cover-placeholder">
                    <span className="cover-icon">🎵</span>
                  </div>
                )}
                <div className="project-status-badge" data-status={project.status}>
                  {project.status}
                </div>
              </div>

              {/* Project Info */}
              <div className="project-info">                <div className="project-header-row">
                  <h3 className="project-title">{project.title}</h3>
                  <button
                    className="delete-project-btn"
                    onClick={(e) => handleDeleteProject(e, project.id, project.title)}
                    disabled={deletingId === project.id}
                    title="Delete project"
                  >
                    {deletingId === project.id ? '⏳' : '🗑️'}
                  </button>
                </div>
                {project.description && (
                  <p className="project-description">{project.description}</p>
                )}

                {/* Metadata */}
                <div className="project-metadata">
                  <span className="metadata-item">
                    <span className="icon">🎹</span>
                    {project.key || 'No key'}
                  </span>
                  <span className="metadata-item">
                    <span className="icon">⏱️</span>
                    {project.bpm} BPM
                  </span>
                  <span className="metadata-item">
                    <span className="icon">🎼</span>
                    {project.time_signature}
                  </span>
                </div>

                {/* Footer */}
                <div className="project-footer">
                  <div className="project-dates">
                    <span className="date-label">Updated:</span>
                    <span className="date-value">
                      {new Date(project.updated_at).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="project-visibility">
                    {project.is_public ? (
                      <span className="visibility-badge public">🌍 Public</span>
                    ) : (
                      <span className="visibility-badge private">🔒 Private</span>
                    )}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <ProjectCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
}
