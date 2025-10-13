// src/pages/dashboard/Dashboard.corporate.tsx
// Ultimate corporate Dashboard - Professional Design

import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useWelcomeMessage } from '../../hooks/useWelcomeMessage';
import WelcomeCard from '../../components/dashboard/WelcomeCard.tsx';
import FeatureGrid from '../../components/dashboard/FeatureGrid.tsx';
import ProjectsSection from '../../components/dashboard/ProjectsSection.tsx';

export default function DashboardCorporate() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  // Verwende unseren Custom Hook für Welcome-Messages
  useWelcomeMessage(user);

  if (loading) {
    return (
      <div className="dashboard-corporate">
        <main className="dashboard-main">
          <div className="dashboard-container">
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Lade Dashboard...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Redirect to auth landing if not logged in
  if (!user) {
    navigate('/');
    return null;
  }

  return (
    <div className="dashboard-corporate">
      {/* Main Dashboard Content */}
      <main className="dashboard-main">
        <div className="dashboard-container">
          <WelcomeCard
            user={user}
          />
          <FeatureGrid />
          <ProjectsSection />
        </div>
      </main>
    </div>
  );
}