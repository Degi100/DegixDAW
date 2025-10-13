// ============================================
// ACCOUNT RECOVERY PAGE
// Multi-step recovery process
// ============================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../hooks/useToast';
import Container from '../../components/layout/Container';
import { generateUsernameVariations } from '../../lib/usernameGenerator';

// Import modular step components
import RecoveryOptionsStep from './components/RecoveryOptionsStep';
import RecoveryUsernameStep from './components/RecoveryUsernameStep';
import RecoveryUsernameSuggestionsStep from './components/RecoveryUsernameSuggestionsStep';
import RecoveryContactStep from './components/RecoveryContactStep';
import RecoverySuccessStep from './components/RecoverySuccessStep';

// Import types
import type { RecoveryStep, ContactDetails } from './types/recovery.types';

export default function AccountRecovery() {
  const navigate = useNavigate();
  const { success, error } = useToast();
  
  // State management
  const [currentStep, setCurrentStep] = useState<RecoveryStep>('options');
  const [username, setUsername] = useState('');
  const [usernameSuggestions, setUsernameSuggestions] = useState<string[]>([]);
  const [contactDetails, setContactDetails] = useState<ContactDetails>({
    name: '',
    description: '',
    alternateEmail: ''
  });

  // ============================================
  // EVENT HANDLERS
  // ============================================

  const handleUsernameSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim()) {
      error('Bitte geben Sie einen Benutzernamen ein');
      return;
    }

    try {
      // Validate username format
      const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
      if (!usernameRegex.test(username.trim())) {
        error('❌ Ungültiges Username-Format. Benutzernamen müssen 3-20 Zeichen lang sein und nur Buchstaben, Zahlen und Unterstriche enthalten.');
        return;
      }

      // Generate username variations to help user remember
      const variations = generateUsernameVariations(username.trim());
      setUsernameSuggestions(variations);
      
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

  const handleContactChange = (field: keyof ContactDetails, value: string) => {
    setContactDetails(prev => ({ ...prev, [field]: value }));
  };

  // ============================================
  // STEP RENDERING
  // ============================================

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'options':
        return (
          <RecoveryOptionsStep
            onSelectUsername={() => setCurrentStep('username')}
            onSelectContact={() => setCurrentStep('contact')}
            onBackToLogin={() => navigate('/login')}
          />
        );

      case 'username':
        return (
          <RecoveryUsernameStep
            username={username}
            onUsernameChange={setUsername}
            onSubmit={handleUsernameSearch}
            onBack={() => setCurrentStep('options')}
          />
        );

      case 'username-suggestions':
        return (
          <RecoveryUsernameSuggestionsStep
            searchedUsername={username}
            suggestions={usernameSuggestions}
            onSelectUsername={handleUsernameSelection}
            onContactSupport={() => setCurrentStep('contact')}
            onNewSearch={() => setCurrentStep('username')}
          />
        );

      case 'contact':
        return (
          <RecoveryContactStep
            contactDetails={contactDetails}
            onContactChange={handleContactChange}
            onSubmit={handleContactSubmit}
            onBack={() => setCurrentStep('options')}
          />
        );

      case 'success':
        return (
          <RecoverySuccessStep
            onGoToLogin={() => navigate('/login')}
            onGoToHome={() => navigate('/')}
          />
        );

      default:
        return (
          <RecoveryOptionsStep
            onSelectUsername={() => setCurrentStep('username')}
            onSelectContact={() => setCurrentStep('contact')}
            onBackToLogin={() => navigate('/login')}
          />
        );
    }
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <Container>
      <div className="page">
        {renderCurrentStep()}
      </div>
    </Container>
  );
}
