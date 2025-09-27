// src/pages/AccountRecovery.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../hooks/useToast';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Container from '../components/layout/Container';
import { ToastContainer } from '../components/ui/Toast';

type RecoveryStep = 'options' | 'username' | 'contact' | 'success';

export default function AccountRecovery() {
  const navigate = useNavigate();
  const { success, error, toasts, removeToast } = useToast();
  const [currentStep, setCurrentStep] = useState<RecoveryStep>('options');
  const [username, setUsername] = useState('');
  const [contactDetails, setContactDetails] = useState({
    name: '',
    description: '',
    alternateEmail: ''
  });

  const handleUsernameSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim()) {
      error('Bitte geben Sie einen Benutzernamen ein');
      return;
    }

    // In a real app, this would search for the user by username
    // For now, we'll simulate the process
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For demo purposes, we'll show that username-based recovery is not available yet
      error('Username-basierte Wiederherstellung ist noch nicht verfügbar. Bitte kontaktieren Sie den Support.');
      setCurrentStep('contact');
    } catch {
      error('Fehler bei der Suche. Bitte versuchen Sie es später erneut.');
    }
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!contactDetails.name.trim() || !contactDetails.description.trim()) {
      error('Bitte füllen Sie alle Pflichtfelder aus');
      return;
    }

    try {
      // Simulate sending contact request
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      success('🚀 Ihre Anfrage wurde gesendet! Wir werden uns in Kürze bei Ihnen melden.');
      setCurrentStep('success');
    } catch {
      error('Fehler beim Senden. Bitte versuchen Sie es später erneut.');
    }
  };

  const renderOptionsStep = () => (
    <div className="card card-large">
      <div className="card-header">
        <h1>🔐 Account-Wiederherstellung</h1>
        <p>Wählen Sie eine Wiederherstellungsmethode:</p>
      </div>
      
      <div className="card-content">
        <div className="recovery-options">
          <div className="recovery-option">
            <h3>📧 E-Mail vergessen</h3>
            <p>Sie können sich an Ihre E-Mail-Adresse nicht erinnern?</p>
            <Button
              onClick={() => setCurrentStep('username')}
              variant="primary"
              fullWidth
            >
              Mit Benutzername suchen
            </Button>
          </div>
          
          <div className="recovery-option">
            <h3>🆘 Vollständiger Datenverlust</h3>
            <p>Sie haben sowohl E-Mail als auch Benutzername vergessen?</p>
            <Button
              onClick={() => setCurrentStep('contact')}
              variant="outline"
              fullWidth
            >
              Support kontaktieren
            </Button>
          </div>
        </div>
        
        <div className="form-actions">
          <Button
            onClick={() => navigate('/login')}
            variant="outline"
          >
            ← Zurück zur Anmeldung
          </Button>
        </div>
      </div>
    </div>
  );

  const renderUsernameStep = () => (
    <div className="card card-large">
      <div className="card-header">
        <h1>👤 Account per Benutzername finden</h1>
        <p>Geben Sie Ihren Benutzernamen ein, um Ihre E-Mail-Adresse zu finden:</p>
      </div>
      
      <form onSubmit={handleUsernameSearch} className="form">
        <div className="form-group">
          <Input
            label="Benutzername"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Ihr Benutzername"
            required
          />
        </div>
        
        <div className="form-actions">
          <Button type="submit">
            Account suchen
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setCurrentStep('options')}
          >
            ← Zurück
          </Button>
        </div>
      </form>
    </div>
  );

  const renderContactStep = () => (
    <div className="card card-large">
      <div className="card-header">
        <h1>📞 Support kontaktieren</h1>
        <p>Wir helfen Ihnen dabei, wieder Zugang zu Ihrem Account zu erhalten:</p>
      </div>
      
      <form onSubmit={handleContactSubmit} className="form">
        <div className="form-group">
          <Input
            label="Vollständiger Name"
            type="text"
            value={contactDetails.name}
            onChange={(e) => setContactDetails(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Max Mustermann"
            required
          />
        </div>
        
        <div className="form-group">
          <Input
            label="Alternative E-Mail-Adresse (optional)"
            type="email"
            value={contactDetails.alternateEmail}
            onChange={(e) => setContactDetails(prev => ({ ...prev, alternateEmail: e.target.value }))}
            placeholder="ihre.alternative@email.com"
          />
        </div>
        
        <div className="form-group">
          <label className="input-label">
            Beschreibung Ihres Problems *
          </label>
          <textarea
            className="textarea"
            value={contactDetails.description}
            onChange={(e) => setContactDetails(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Beschreiben Sie uns, was passiert ist und welche Informationen Sie noch über Ihren Account wissen..."
            rows={4}
            required
          />
        </div>
        
        <div className="info-box">
          <p><strong>ℹ️ Hilfreiche Informationen:</strong></p>
          <ul>
            <li>Ungefähres Registrierungsdatum</li>
            <li>Projekte oder Aktivitäten in Ihrem Account</li>
            <li>Verwendete OAuth-Provider (Google, Discord)</li>
            <li>Alle anderen Details, die zur Identifikation helfen könnten</li>
          </ul>
        </div>
        
        <div className="form-actions">
          <Button type="submit">
            Anfrage senden
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setCurrentStep('options')}
          >
            ← Zurück
          </Button>
        </div>
      </form>
    </div>
  );

  const renderSuccessStep = () => (
    <div className="card card-large">
      <div className="card-header">
        <div className="success-icon">✅</div>
        <h1>Anfrage erfolgreich gesendet!</h1>
      </div>
      
      <div className="card-content">
        <div className="success-message">
          <p>Vielen Dank für Ihre Anfrage. Unser Support-Team wird sich in Kürze bei Ihnen melden.</p>
          
          <div className="info-box">
            <p><strong>📋 Nächste Schritte:</strong></p>
            <ul>
              <li>Überprüfen Sie Ihr E-Mail-Postfach (auch Spam-Ordner)</li>
              <li>Antwortzeit: In der Regel 1-2 Werktage</li>
              <li>Halten Sie alle verfügbaren Account-Informationen bereit</li>
            </ul>
          </div>
        </div>
        
        <div className="form-actions">
          <Button
            onClick={() => navigate('/login')}
            variant="primary"
          >
            Zur Anmeldung
          </Button>
          <Button
            onClick={() => navigate('/')}
            variant="outline"
          >
            Zur Startseite
          </Button>
        </div>
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'options': return renderOptionsStep();
      case 'username': return renderUsernameStep();
      case 'contact': return renderContactStep();
      case 'success': return renderSuccessStep();
      default: return renderOptionsStep();
    }
  };

  return (
    <Container>
      <div className="page">
        {renderCurrentStep()}
      </div>
      
      <ToastContainer 
        toasts={toasts}
        onRemove={removeToast}
      />
    </Container>
  );
}