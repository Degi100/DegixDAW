// src/pages/Dashboard.advanced.tsx
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { useWelcomeMessage } from '../hooks/useWelcomeMessage';
import { ToastContainer } from '../components/ui/Toast';
import { LoadingOverlay } from '../components/ui/Loading';
import Container from '../components/layout/Container';
import WelcomeCard from '../components/ui/WelcomeCard';
import FeatureGrid from '../components/ui/FeatureGrid';
import ProjectsSection from '../components/ui/ProjectsSection';
import GuestPrompt from '../components/ui/GuestPrompt';
import styles from './Dashboard.module.css';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();
  const { success, toasts, removeToast } = useToast();

  // Verwende unseren Custom Hook für Welcome-Messages
  useWelcomeMessage(user);

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
            <>
              <WelcomeCard 
                user={user}
                onNavigateToSettings={() => navigate('/settings')}
                onLogout={handleLogout}
              />
              <FeatureGrid />
              <ProjectsSection />
            </>
          ) : (
            <>
              <GuestPrompt onNavigateToLogin={() => navigate('/login')} />
              <FeatureGrid />
            </>
          )}
        </div>
      </Container>
      
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );
}