// ============================================
// FILE BROWSER PLACEHOLDER
// Info card shown when browser is in floating mode
// ============================================

interface FileBrowserPlaceholderProps {
  onBackToDocked: () => void;
}

export default function FileBrowserPlaceholder({ onBackToDocked }: FileBrowserPlaceholderProps) {
  return (
    <div className="file-browser-placeholder">
      <div className="placeholder-card">
        <div className="placeholder-icon">🪟</div>
        <h2 className="placeholder-title">Datei-Browser ist ausgeklappt</h2>
        <p className="placeholder-description">
          Der Datei-Browser läuft als eigenes Fenster und schwebt über der Seite.
          Du kannst ihn frei bewegen und die Größe anpassen.
        </p>

        <div className="placeholder-features">
          <div className="feature-item">
            <span className="feature-icon">🖱️</span>
            <span className="feature-text">Ziehen zum Bewegen</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">📌</span>
            <span className="feature-text">Pin-Button zum Andocken</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">➖</span>
            <span className="feature-text">Minimieren/Maximieren</span>
          </div>
        </div>

        <button
          className="btn btn-primary placeholder-btn"
          onClick={onBackToDocked}
        >
          ↩️ Zurück zur Seitenansicht
        </button>

        <p className="placeholder-hint">
          <strong>Tipp:</strong> Das Fenster bleibt sichtbar, auch wenn du zu anderen Seiten navigierst!
        </p>
      </div>
    </div>
  );
}
