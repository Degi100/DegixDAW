// src/components/ui/ProjectsSection.tsx
import Button from '../ui/Button';
import { EMOJIS } from '../../lib/constants';

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
    <section className="content-section">
      <h3 className="features-title">{EMOJIS.projects} Meine Projekte</h3>
      <div className="content-grid">
        {PROJECT_CARDS.map((card, index) => (
          <div key={index} className="content-card">
            <h4 className="content-title">{card.title}</h4>
            <p className="content-description">{card.description}</p>
            <Button variant="secondary" size="small">
              {card.buttonText}
            </Button>
          </div>
        ))}
      </div>
    </section>
  );
}