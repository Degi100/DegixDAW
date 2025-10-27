import { useAuth } from '../../hooks/useAuth';
import FileBrowser from '../../components/files/FileBrowser';
import FileBrowserPlaceholder from '../../components/files/FileBrowserPlaceholder';
import { useFloatingFileBrowserContext } from '../../contexts/FloatingFileBrowserContext';

export default function FileBrowserPage() {
  const { user } = useAuth();
  const floatingState = useFloatingFileBrowserContext();

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

  const handlePopOut = () => {
    floatingState.setIsFloating(true);
  };

  const handleBackToDocked = () => {
    floatingState.setIsFloating(false);
  };

  return (
    <>
      <div className="dashboard-corporate">
        <main className="dashboard-main">
          <div className="dashboard-container">
            {/* Show placeholder when floating, otherwise show normal browser */}
            {floatingState.isFloating ? (
              <FileBrowserPlaceholder onBackToDocked={handleBackToDocked} />
            ) : (
              <>
                <div className="file-browser-header-bar">
                  <h1 className="page-title">📁 Datei-Browser</h1>
                  <button
                    className="btn btn-outline pop-out-btn"
                    onClick={handlePopOut}
                  >
                    🪟 In eigenem Fenster öffnen
                  </button>
                </div>
                <FileBrowser userId={user.id} />
              </>
            )}
          </div>
        </main>
      </div>
    </>
  );
}
