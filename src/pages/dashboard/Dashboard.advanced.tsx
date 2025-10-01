// src/pages/Dashboard.advanced.tsx
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
// Toast functionality moved to components
import { useWelcomeMessage } from '../../hooks/useWelcomeMessage';
import { LoadingOverlay } from '../../components/ui/Loading';
import Container from '../../components/layout/Container';
import WelcomeCard from '../../components/dashboard/WelcomeCard';
import FeatureGrid from '../../components/dashboard/FeatureGrid';
import { APP_FULL_NAME } from '../../lib/constants';
import ProjectsSection from '../../components/dashboard/ProjectsSection';
import GuestPrompt from '../../components/dashboard/GuestPrompt';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  // Verwende unseren Custom Hook für Welcome-Messages
  useWelcomeMessage(user);

  // Logout functionality moved to WelcomeCard component

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