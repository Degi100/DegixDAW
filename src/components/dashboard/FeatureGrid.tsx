// src/components/ui/FeatureGrid.tsx

interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="feature-card">
      <div className="feature-icon">{icon}</div>
      <h4 className="feature-title">{title}</h4>
      <p className="feature-description">{description}</p>
    </div>
  );
}

const FEATURES = [
  {
    icon: '🎛️',
    title: 'DAW-Integration',
    description: 'Nahtlose Integration mit professionellen Digital Audio Workstations'
  },
  {
    icon: '🌍',
    title: 'Globaler Austausch',
    description: 'Teilen und kollaborieren Sie mit Musikern weltweit'
  },
  {
    icon: '⚡',
    title: 'Echtzeit-Kollaboration',
    description: 'Arbeiten Sie in Echtzeit an Projekten mit anderen'
  },
  {
    icon: '🔊',
    title: 'High-Quality Audio',
    description: 'Verlustfreie Audio-Verarbeitung und -Übertragung'
  },
  {
    icon: '📁',
    title: 'Cloud-Verwaltung',
    description: 'Sichere Cloud-basierte Projektverwaltung'
  },
  {
    icon: '🎹',
    title: 'MIDI & VST Support',
    description: 'Vollständige MIDI-Unterstützung und VST-Integration'
  }
];

export default function FeatureGrid() {
  return (
    <section className="features-section">
      <h3 className="features-title">🎵 Features</h3>
      <div className="features-grid">
        {FEATURES.map((feature, index) => (
          <FeatureCard
            key={index}
            icon={feature.icon}
            title={feature.title}
            description={feature.description}
          />
        ))}
      </div>
    </section>
  );
}