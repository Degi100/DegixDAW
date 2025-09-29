// src/components/ui/ErrorBoundary.tsx
import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import Container from '../layout/Container';
import Button from './Button';
import { APP_FULL_NAME, EMOJIS } from '../../lib/constants';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="page">
          <Container>
            <div className="content-center">
              <div className="card card-large">
                <div className="error-content">
                  <div className="error-icon">{EMOJIS.error}</div>
                  <h2 className="error-title">Oops! Etwas ist schiefgelaufen</h2>
                  <p className="error-message">
                    {APP_FULL_NAME} hat einen unerwarteten Fehler festgestellt. 
                    Das tut uns leid!
                  </p>
                  
                  <div className="error-actions">
                    <Button
                      onClick={this.handleReload}
                      variant="primary"
                      size="large"
                    >
                      {EMOJIS.realtime} Seite neu laden
                    </Button>
                    
                    <Button
                      onClick={this.handleGoHome}
                      variant="secondary"
                      size="large"
                    >
                      {EMOJIS.logo} Zur Startseite
                    </Button>
                  </div>

                  {process.env.NODE_ENV === 'development' && this.state.error && (
                    <details className="error-details">
                      <summary>Entwickler-Details</summary>
                      <pre className="error-stack">
                        {this.state.error.toString()}
                        {this.state.errorInfo?.componentStack}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            </div>
          </Container>
        </div>
      );
    }

    return this.props.children;
  }
}