// src/pages/Dashboard.advanced.tsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import Button from '../components/ui/Button';
import { ToastContainer } from '../components/ui/Toast';
import { LoadingOverlay } from '../components/ui/Loading';
import Container from '../components/layout/Container';
import styles from './Dashboard.module.css';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();
  const { success, toasts, removeToast } = useToast();

  useEffect(() => {
    if (user) {
      // Kombiniere session-basiert (für Navigation) und tag-basiert (für neue Logins)
      const today = new Date().toDateString();
      const sessionKey = `welcome-session-${user.id}`;
      const dailyKey = `welcome-daily-${user.id}`;
      
      // Bereinige alte localStorage-Einträge (älter als 7 Tage)
      const cleanupOldWelcomes = () => {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('welcome-daily-')) {
            const storedDate = localStorage.getItem(key);
            if (storedDate && new Date(storedDate) < sevenDaysAgo) {
              localStorage.removeItem(key);
            }
          }
        });
      };
      
      // Bereinige beim ersten Load
      cleanupOldWelcomes();
      
      // Prüfe ob bereits in dieser Session eine Nachricht gezeigt wurde
      const hasShownInSession = sessionStorage.getItem(sessionKey);
      
      // Prüfe ob bereits heute eine Nachricht gezeigt wurde
      const lastShownDate = localStorage.getItem(dailyKey);
      const hasShownToday = lastShownDate === today;
      
      // Zeige Willkommen nur wenn:
      // 1. Noch nicht in dieser Session gezeigt UND
      // 2. Noch nicht heute gezeigt (neuer Tag) ODER erster Login des Tages
      if (!hasShownInSession && !hasShownToday) {
        success(`Willkommen zurück, ${user.user_metadata?.full_name || user.email}!`);
        
        // Markiere für diese Session (verschwindet beim Browser-Schließen)
        sessionStorage.setItem(sessionKey, 'true');
        // Markiere für heute (bleibt bis Mitternacht)
        localStorage.setItem(dailyKey, today);
      }
    }
  }, [user, success]);

  const handleLogout = async () => {
    const result = await signOut();
    if (result.success) {
      success('Erfolgreich abgemeldet!');
      navigate('/login');
    }
  };

  if (loading) {
    return <LoadingOverlay />;
  }

  return (
    <>
      <Container>
        <div className={styles.dashboard}>
          <header className={styles.header}>
            <h1 className={styles.title}>🎧 DegixDAW Dashboard</h1>
            <p className={styles.subtitle}>
              <strong>D</strong>AW-integrated, <strong>E</strong>ffortless, <strong>G</strong>lobal, <strong>I</strong>nstant e<strong>X</strong>change
            </p>
          </header>
          
          {user ? (
            <section className={styles.userSection}>
              <div className={styles.welcomeCard}>
                <h2 className={styles.welcomeTitle}>Willkommen zurück!</h2>
                <div className={styles.userInfo}>
                  <p><strong>Email:</strong> {user.email}</p>
                  {user.user_metadata?.full_name && (
                    <p><strong>Name:</strong> {user.user_metadata.full_name}</p>
                  )}
                  {user.user_metadata?.username && (
                    <p><strong>Username:</strong> @{user.user_metadata.username}</p>
                  )}
                </div>
                
                <div className={styles.actionButtons}>
                  <Button 
                    onClick={() => navigate('/settings')}
                    variant="primary"
                  >
                    ⚙️ Einstellungen
                  </Button>
                  <Button 
                    onClick={handleLogout}
                    variant="outline"
                  >
                    👋 Abmelden
                  </Button>
                </div>
              </div>
            </section>
          ) : (
            <section className={styles.guestSection}>
              <div className={styles.guestCard}>
                <h2 className={styles.guestTitle}>Entdecken Sie DegixDAW</h2>
                <p className={styles.guestDescription}>
                  Sie nutzen die App ohne Anmeldung. Melden Sie sich an, um alle Features zu nutzen!
                </p>
                
                <div className={styles.actionButtons}>
                  <Button 
                    onClick={() => navigate('/login')}
                    variant="primary"
                    size="large"
                  >
                    🚀 Jetzt anmelden
                  </Button>
                </div>
              </div>
            </section>
          )}
          
          <section className={styles.featuresSection}>
            <h3 className={styles.featuresTitle}>🎵 Features</h3>
            <div className={styles.featuresGrid}>
              <div className={styles.featureCard}>
                <div className={styles.featureIcon}>🎛️</div>
                <h4>DAW-Integration</h4>
                <p>Nahtlose Integration mit professionellen Digital Audio Workstations</p>
              </div>
              
              <div className={styles.featureCard}>
                <div className={styles.featureIcon}>🌍</div>
                <h4>Globaler Austausch</h4>
                <p>Teilen und kollaborieren Sie mit Musikern weltweit</p>
              </div>
              
              <div className={styles.featureCard}>
                <div className={styles.featureIcon}>⚡</div>
                <h4>Echtzeit-Kollaboration</h4>
                <p>Arbeiten Sie in Echtzeit an Projekten mit anderen</p>
              </div>
              
              <div className={styles.featureCard}>
                <div className={styles.featureIcon}>🔊</div>
                <h4>High-Quality Audio</h4>
                <p>Verlustfreie Audio-Verarbeitung und -Übertragung</p>
              </div>
              
              <div className={styles.featureCard}>
                <div className={styles.featureIcon}>📁</div>
                <h4>Cloud-Verwaltung</h4>
                <p>Sichere Cloud-basierte Projektverwaltung</p>
              </div>
              
              <div className={styles.featureCard}>
                <div className={styles.featureIcon}>🎹</div>
                <h4>MIDI & VST Support</h4>
                <p>Vollständige MIDI-Unterstützung und VST-Integration</p>
              </div>
            </div>
          </section>
          
          {user ? (
            <section className={styles.userContentSection}>
              <h3 className={styles.sectionTitle}>🎼 Meine Projekte</h3>
              <div className={styles.contentGrid}>
                <div className={styles.contentCard}>
                  <h4>📁 Meine Bibliothek</h4>
                  <p>Ihre persönlich gespeicherten Audio- und MIDI-Aufnahmen</p>
                  <Button variant="secondary" size="small">
                    Bibliothek öffnen
                  </Button>
                </div>
                
                <div className={styles.contentCard}>
                  <h4>🎵 Aktuelle Projekte</h4>
                  <p>Projekte, an denen Sie gerade arbeiten</p>
                  <Button variant="secondary" size="small">
                    Projekte anzeigen
                  </Button>
                </div>
                
                <div className={styles.contentCard}>
                  <h4>👥 Kollaborationen</h4>
                  <p>Gemeinsame Projekte mit anderen Musikern</p>
                  <Button variant="secondary" size="small">
                    Kollaborationen
                  </Button>
                </div>
              </div>
            </section>
          ) : (
            <section className={styles.guestPromptSection}>
              <div className={styles.guestPromptCard}>
                <h3 className={styles.guestPromptTitle}>🔓 Erweiterte Features freischalten</h3>
                <div className={styles.benefitsList}>
                  <div className={styles.benefit}>
                    <span className={styles.benefitIcon}>💾</span>
                    <span>Eigene Audio- und MIDI-Aufnahmen speichern</span>
                  </div>
                  <div className={styles.benefit}>
                    <span className={styles.benefitIcon}>🤝</span>
                    <span>Ideen mit anderen Musikern teilen</span>
                  </div>
                  <div className={styles.benefit}>
                    <span className={styles.benefitIcon}>⭐</span>
                    <span>Favoriten markieren und organisieren</span>
                  </div>
                  <div className={styles.benefit}>
                    <span className={styles.benefitIcon}>🎯</span>
                    <span>An Community-Projekten teilnehmen</span>
                  </div>
                  <div className={styles.benefit}>
                    <span className={styles.benefitIcon}>☁️</span>
                    <span>Cloud-Synchronisation für alle Geräte</span>
                  </div>
                </div>
                
                <Button 
                  onClick={() => navigate('/login')}
                  variant="success"
                  size="large"
                  fullWidth
                >
                  🚀 Kostenloses Konto erstellen
                </Button>
              </div>
            </section>
          )}
        </div>
      </Container>
      
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );
}