// src/pages/AccountRecovery.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../hooks/useToast';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Container from '../../components/layout/Container';
import { generateUsernameVariations } from '../../lib/usernameGenerator';

type RecoveryStep = 'options' | 'username' | 'username-suggestions' | 'contact' | 'success';

export default function AccountRecovery() {
  const navigate = useNavigate();
  const { success, error } = useToast();
  const [currentStep, setCurrentStep] = useState<RecoveryStep>('options');
  const [username, setUsername] = useState('');
  const [usernameSuggestions, setUsernameSuggestions] = useState<string[]>([]);
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

    try {
      // Since we can't directly query user_metadata from client-side,
      // we'll use a different approach: guide user to contact support
      // with their username information
      
      // First, validate username format
      const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
      if (!usernameRegex.test(username.trim())) {
        error('❌ Ungültiges Username-Format. Benutzernamen müssen 3-20 Zeichen lang sein und nur Buchstaben, Zahlen und Unterstriche enthalten.');
        return;
      }

      // Generate username variations to help user remember
      const variations = generateUsernameVariations(username.trim());
      setUsernameSuggestions(variations);
      
      // Show username suggestions first
      success(`✅ Username "${username}" verarbeitet. Sehen Sie sich die Vorschläge an oder kontaktieren Sie den Support.`);
      setCurrentStep('username-suggestions');
    } catch {
      error('❌ Fehler bei der Verarbeitung. Bitte versuchen Sie es erneut.');
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
        <p>Geben Sie Ihren Benutzernamen ein. Wir leiten Sie dann zur Support-Kontaktierung weiter:</p>
      </div>
      
      <form onSubmit={handleUsernameSearch} className="form">
        <div className="form-group">
          <Input
            label="Benutzername"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="z.B. max_mustermann oder john123"
            required
          />
        </div>

        <div className="info-box">
          <p><strong>💡 Username-Tipps:</strong></p>
          <ul>
            <li>Benutzernamen sind 3-20 Zeichen lang</li>
            <li>Enthalten nur Buchstaben, Zahlen und Unterstriche</li>
            <li>Wurden bei der Registrierung oder beim ersten OAuth-Login erstellt</li>
            <li>Oft basierend auf Ihrem Namen oder E-Mail-Adresse generiert</li>
          </ul>
        </div>
        
        <div className="form-actions">
          <Button type="submit">
            Username prüfen
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

  const handleUsernameSelection = (selectedUsername: string) => {
    setUsername(selectedUsername);
    
    // Pre-fill contact form with selected username
    setContactDetails(prev => ({
      ...prev,
      description: `Ich möchte meinen Account mit dem Benutzernamen "${selectedUsername}" wiederherstellen. Ich habe meine E-Mail-Adresse vergessen, aber kann mich an folgende Details erinnern: [Bitte ergänzen Sie weitere Details wie Registrierungsdatum, verwendete OAuth-Provider, etc.]`
    }));
    
    success(`✅ Username "${selectedUsername}" ausgewählt. Sie werden nun zum Support-Kontakt weitergeleitet.`);
    setCurrentStep('contact');
  };

  const renderUsernameSuggestionsStep = () => (
    <div className="card card-large">
      <div className="card-header">
        <h1>🔍 Username-Vorschläge</h1>
        <p>Basierend auf "{username}" haben wir folgende Variationen gefunden:</p>
      </div>
      
      <div className="card-content">
        <div className="username-suggestions">
          {usernameSuggestions.map((suggestion, index) => (
            <div key={index} className="username-suggestion">
              <span className="username-text">{suggestion}</span>
              <Button
                onClick={() => handleUsernameSelection(suggestion)}
                variant="outline"
                size="small"
              >
                Das ist mein Username
              </Button>
            </div>
          ))}
        </div>

        <div className="info-box">
          <p><strong>💡 Nicht dabei?</strong></p>
          <p>Wenn keiner dieser Vorschläge Ihr Username ist, können Sie:</p>
          <ul>
            <li>Einen anderen Suchbegriff versuchen</li>
            <li>Direkt den Support kontaktieren</li>
          </ul>
        </div>
        
        <div className="form-actions">
          <Button
            onClick={() => setCurrentStep('contact')}
            variant="primary"
          >
            Support kontaktieren
          </Button>
          <Button
            onClick={() => setCurrentStep('username')}
            variant="outline"
          >
            ← Neue Suche
          </Button>
        </div>
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'options': return renderOptionsStep();
      case 'username': return renderUsernameStep();
      case 'username-suggestions': return renderUsernameSuggestionsStep();
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
      
    </Container>
  );
}