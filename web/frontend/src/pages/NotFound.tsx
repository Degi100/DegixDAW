// src/pages/NotFound.tsx
import { useNavigate } from 'react-router-dom';
import Container from '../components/layout/Container';
import Button from '../components/ui/Button';
import { APP_FULL_NAME, EMOJIS } from '../lib/constants';

export default function NotFound() {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate('/');
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div className="page">
      <Container>
        <div className="content-center">
          <div className="card card-large">
            <div className="error-content">
              <div className="error-icon">🔍</div>
              <h1 className="error-title">404 - Seite nicht gefunden</h1>
              <p className="error-message">
                Die Seite, die Sie suchen, existiert nicht in {APP_FULL_NAME}.
                Möglicherweise wurde sie verschoben oder gelöscht.
              </p>
              
              <div className="error-actions">
                <Button
                  onClick={handleGoHome}
                  variant="primary"
                  size="large"
                >
                  {EMOJIS.logo} Zur Startseite
                </Button>
                
                <Button
                  onClick={handleGoBack}
                  variant="secondary"
                  size="large"
                >
                  ⬅️ Zurück
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}