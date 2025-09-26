// src/components/ui/ProjectsSection.tsx
import Button from '../ui/Button';
import styles from './ProjectsSection.module.css';

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
    <section className={styles.userContentSection}>
      <h3 className={styles.sectionTitle}>🎼 Meine Projekte</h3>
      <div className={styles.contentGrid}>
        {PROJECT_CARDS.map((card, index) => (
          <div key={index} className={styles.contentCard}>
            <h4>{card.title}</h4>
            <p>{card.description}</p>
            <Button variant="secondary" size="small">
              {card.buttonText}
            </Button>
          </div>
        ))}
      </div>
    </section>
  );
}