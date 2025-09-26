// src/components/ui/FeatureGrid.tsx
import { FEATURES, EMOJIS } from '../../lib/constants';

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

export default function FeatureGrid() {
  return (
    <section className="features-section">
      <h3 className="features-title">{EMOJIS.music} Features</h3>
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