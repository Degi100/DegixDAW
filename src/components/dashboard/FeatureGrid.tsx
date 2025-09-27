// src/components/ui/FeatureGrid.tsx
import { FEATURES } from '../../lib/constants';

export default function FeatureGrid() {
  return (
    <section className="features-section-corporate">
      <div className="section-header">
        <div className="header-content">
          <h3 className="section-title">🚀 Professional Features</h3>
          <p className="section-subtitle">
            Industry-leading tools designed for professional music production
          </p>
        </div>
        
        <div className="header-stats">
          <div className="stat-chip">
            <span className="chip-icon">⚡</span>
            <span className="chip-text">Ultra-Low Latency</span>
          </div>
          <div className="stat-chip">
            <span className="chip-icon">🎯</span>
            <span className="chip-text">Studio Quality</span>
          </div>
        </div>
      </div>
      
      <div className="features-grid-corporate">
        {FEATURES.map((feature, index) => (
          <div key={index} className={`feature-card-corporate ${index % 2 === 0 ? 'highlighted' : ''}`}>
            <div className="feature-header">
              <div className="feature-icon-corporate">{feature.icon}</div>
              <div className="feature-status">
                <span className="status-dot"></span>
                <span className="status-text">Available</span>
              </div>
            </div>
            
            <div className="feature-content">
              <h4 className="feature-title-corporate">{feature.title}</h4>
              <p className="feature-description-corporate">{feature.description}</p>
            </div>
            
            <div className="feature-action">
              <button className="feature-btn">
                <span>Explore</span>
                <span className="arrow">→</span>
              </button>
            </div>
          </div>
        ))}
      </div>
      
      {/* Call to Action */}
      <div className="features-cta">
        <div className="cta-content">
          <h4 className="cta-title">Ready to Create Something Amazing?</h4>
          <p className="cta-description">Join thousands of producers creating professional music.</p>
        </div>
        <button className="cta-button">
          <span>Start Free Trial</span>
          <span className="cta-icon">🚀</span>
        </button>
      </div>
    </section>
  );
}