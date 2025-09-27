// src/pages/Dashboard.advanced.tsx
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { useWelcomeMessage } from '../hooks/useWelcomeMessage';
import { LoadingOverlay } from '../components/ui/Loading';
import Container from '../components/layout/Container';
import WelcomeCard from '../components/dashboard/WelcomeCard';
import FeatureGrid from '../components/dashboard/FeatureGrid';
import { APP_FULL_NAME } from '../lib/constants';
import ProjectsSection from '../components/dashboard/ProjectsSection';
import GuestPrompt from '../components/dashboard/GuestPrompt';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();
  const { success } = useToast();

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
        <div className="page">
          <header className="page-header">
            <h1 className="page-title">{APP_FULL_NAME} Dashboard</h1>
            <p className="page-subtitle">
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
    </>
  );
}