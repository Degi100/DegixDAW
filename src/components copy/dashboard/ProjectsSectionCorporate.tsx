// src/components/dashboard/ProjectsSectionCorporate.tsx
// Ultimate Corporate Projects Section with Professional Design

import Button from '../ui/Button';

// Mock project data for demonstration
const recentProjects = [
  {
    id: '1',
    name: 'Summer Vibes Mix',
    type: 'Electronic',
    progress: 75,
    lastModified: '2 hours ago',
    collaborators: 2,
    status: 'active'
  },
  {
    id: '2', 
    name: 'Acoustic Ballad Demo',
    type: 'Folk',
    progress: 45,
    lastModified: '1 day ago',
    collaborators: 1,
    status: 'draft'
  },
  {
    id: '3',
    name: 'Hip-Hop Beat Collection',
    type: 'Hip-Hop',
    progress: 90,
    lastModified: '3 days ago', 
    collaborators: 3,
    status: 'review'
  }
];

interface ProjectCardProps {
  project: typeof recentProjects[0];
}

function ProjectCard({ project }: ProjectCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#22c55e';
      case 'draft': return '#f59e0b';
      case 'review': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  return (
    <div className="project-card-corporate">
      <div className="project-header">
        <div className="project-info">
          <h4 className="project-name">{project.name}</h4>
          <span className="project-type">{project.type}</span>
        </div>
        
        <div className="project-status">
          <div 
            className="status-indicator"
            style={{ backgroundColor: getStatusColor(project.status) }}
          ></div>
          <span className="status-text">{project.status}</span>
        </div>
      </div>
      
      <div className="project-progress">
        <div className="progress-info">
          <span className="progress-label">Progress</span>
          <span className="progress-value">{project.progress}%</span>
        </div>
        <div className="progress-bar">
          <div 
            className="progress-fill"
            style={{ width: `${project.progress}%` }}
          ></div>
        </div>
      </div>
      
      <div className="project-meta">
        <div className="meta-item">
          <span className="meta-icon">👥</span>
          <span className="meta-text">{project.collaborators} collaborators</span>
        </div>
        <div className="meta-item">
          <span className="meta-icon">⏰</span>
          <span className="meta-text">{project.lastModified}</span>
        </div>
      </div>
      
      <div className="project-actions">
        <Button size="small" variant="outline">
          📝 Edit
        </Button>
        <Button size="small" variant="primary">
          ▶️ Open
        </Button>
      </div>
    </div>
  );
}

export default function ProjectsSectionCorporate() {
  return (
    <section className="projects-section-corporate">
      <div className="section-header">
        <div className="header-main">
          <h3 className="section-title">🎼 Your Projects</h3>
          <p className="section-subtitle">Continue working on your latest creations</p>
        </div>
        
        <div className="header-actions">
          <Button variant="outline" size="small">
            📁 Browse All
          </Button>
          <Button variant="primary">
            ✨ New Project
          </Button>
        </div>
      </div>
      
      {recentProjects.length > 0 ? (
        <div className="projects-grid-corporate">
          {recentProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      ) : (
        <div className="empty-projects">
          <div className="empty-content">
            <div className="empty-icon">🎵</div>
            <h4 className="empty-title">No Projects Yet</h4>
            <p className="empty-description">
              Start your musical journey by creating your first project.
            </p>
            <Button variant="primary" size="large">
              🎼 Create First Project
            </Button>
          </div>
        </div>
      )}
      
      {/* Quick Stats */}
      <div className="projects-stats">
        <div className="stats-grid">
          <div className="stat-item">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <div className="stat-number">{recentProjects.length}</div>
              <div className="stat-label">Active Projects</div>
            </div>
          </div>
          
          <div className="stat-item">
            <div className="stat-icon">⏱️</div>
            <div className="stat-content">
              <div className="stat-number">24h</div>
              <div className="stat-label">Total Studio Time</div>
            </div>
          </div>
          
          <div className="stat-item">
            <div className="stat-icon">🤝</div>
            <div className="stat-content">
              <div className="stat-number">{recentProjects.reduce((sum, p) => sum + p.collaborators, 0)}</div>
              <div className="stat-label">Collaborators</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}