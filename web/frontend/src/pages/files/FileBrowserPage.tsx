import { useAuth } from '../../hooks/useAuth';
import FileBrowser from '../../components/files/FileBrowser';

export default function FileBrowserPage() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="dashboard-corporate">
        <main className="dashboard-main">
          <div className="dashboard-container">
            <div className="loading-state">
              <p>Bitte melden Sie sich an, um auf Ihre Dateien zuzugreifen.</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="dashboard-corporate">
      <main className="dashboard-main">
        <div className="dashboard-container">
          <FileBrowser userId={user.id} />
        </div>
      </main>
    </div>
  );
}
