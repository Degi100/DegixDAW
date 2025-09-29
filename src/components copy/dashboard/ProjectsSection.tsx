// src/components/ui/ProjectsSection.tsx
import Button from '../ui/Button';
// Using corporate design

const PROJECT_CARDS = [
  {
    title: '📁 Meine Bibliothek',
    description: 'Ihre persönlich gespeicherten Audio- und MIDI-Aufnahmen',
    buttonText: 'Bibliothek öffnen'
  },
  {
    title: '🎵 Aktuelle Projekte',
    description: 'Projekte, an denen Sie gerade arbeiten',
    buttonText: 'Projekte anzeigen'
  },
  {
    title: '👥 Kollaborationen',
    description: 'Gemeinsame Projekte mit anderen Musikern',
    buttonText: 'Kollaborationen'
  }
];

export default function ProjectsSection() {
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
      
      <div className="projects-grid-corporate">
        {PROJECT_CARDS.map((card, index) => (
          <div key={index} className="project-card-corporate">
            <div className="project-header">
              <div className="project-info">
                <h4 className="project-name">{card.title.replace(/📁|🎵|👥/, '').trim()}</h4>
                <span className="project-type">Audio Project</span>
              </div>
              
              <div className="project-status">
                <div className="status-indicator" style={{ backgroundColor: index === 1 ? '#22c55e' : '#f59e0b' }}></div>
                <span className="status-text">{index === 1 ? 'active' : 'draft'}</span>
              </div>
            </div>
            
            <div className="project-progress">
              <div className="progress-info">
                <span className="progress-label">Progress</span>
                <span className="progress-value">{25 + index * 25}%</span>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${25 + index * 25}%` }}
                ></div>
              </div>
            </div>
            
            <div className="project-meta">
              <div className="meta-item">
                <span className="meta-icon">👥</span>
                <span className="meta-text">{index + 1} collaborators</span>
              </div>
              <div className="meta-item">
                <span className="meta-icon">⏰</span>
                <span className="meta-text">{index + 1} day(s) ago</span>
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
        ))}
      </div>
      
      {/* Quick Stats */}
      <div className="projects-stats">
        <div className="stats-grid">
          <div className="stat-item">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <div className="stat-number">{PROJECT_CARDS.length}</div>
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
              <div className="stat-number">6</div>
              <div className="stat-label">Collaborators</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}