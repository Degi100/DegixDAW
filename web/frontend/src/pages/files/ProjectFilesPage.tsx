// ============================================
// PROJECT FILES PAGE
// Test page for user_files integration
// Route: /project-files
// ============================================

import { useAuth } from '../../hooks/useAuth';
import ProjectFilesView from '../../components/files/ProjectFilesView';

export default function ProjectFilesPage() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="project-files-page">
        <p>Please log in to view your files.</p>
      </div>
    );
  }

  return (
    <div className="project-files-page">
      <ProjectFilesView userId={user.id} />
    </div>
  );
}
