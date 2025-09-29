// src/components/dashboard/FeatureGridCorporate.tsx
// Ultimate Corporate Feature Grid with Professional Design

// Using custom corporate features instead

interface FeatureCardCorporateProps {
  icon: string;
  title: string;
  description: string;
  isHighlighted?: boolean;
}

function FeatureCardCorporate({ icon, title, description, isHighlighted }: FeatureCardCorporateProps) {
  return (
    <div className={`feature-card-corporate ${isHighlighted ? 'highlighted' : ''}`}>
      <div className="feature-header">
        <div className="feature-icon-corporate">{icon}</div>
        <div className="feature-status">
          <span className="status-dot"></span>
          <span className="status-text">Available</span>
        </div>
      </div>
      
      <div className="feature-content">
        <h4 className="feature-title-corporate">{title}</h4>
        <p className="feature-description-corporate">{description}</p>
      </div>
      
      <div className="feature-action">
        <button className="feature-btn">
          <span>Explore</span>
          <span className="arrow">→</span>
        </button>
      </div>
    </div>
  );
}

// Enhanced features with corporate descriptions
const corporateFeatures = [
  {
    icon: '🎵',
    title: 'Professional Audio Engine',
    description: 'Industry-standard 64-bit audio processing with ultra-low latency performance.',
    highlighted: true
  },
  {
    icon: '🎹',
    title: 'Virtual Instruments Suite',
    description: 'Premium synthesizers, samplers, and orchestral instruments included.',
    highlighted: false
  },
  {
    icon: '🎸',
    title: 'Advanced Effects Rack',
    description: 'Professional-grade reverbs, compressors, EQs, and creative effects.',
    highlighted: false
  },
  {
    icon: '🥁',
    title: 'Intelligent Drum Engine',
    description: 'AI-powered drum patterns with realistic acoustic modeling.',
    highlighted: true
  },
  {
    icon: '🎼',
    title: 'Smart Composition Tools',
    description: 'Chord progression suggestions and melody generation assistance.',
    highlighted: false
  },
  {
    icon: '🔊',
    title: 'Professional Mixing',
    description: 'Advanced console emulation with vintage analog character.',
    highlighted: false
  }
];

export default function FeatureGridCorporate() {
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
        {corporateFeatures.map((feature, index) => (
          <FeatureCardCorporate
            key={index}
            icon={feature.icon}
            title={feature.title}
            description={feature.description}
            isHighlighted={feature.highlighted}
          />
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