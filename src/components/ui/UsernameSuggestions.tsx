// src/components/ui/UsernameSuggestions.tsx
import { useState, useEffect } from 'react';
import { generateAlternativeUsernames, generateSmartUsernameSuggestions } from '../../lib/usernameGenerator';
import { checkUsernameExists } from '../../lib/supabase';
import styles from './UsernameSuggestions.module.css';

interface UsernameSuggestionsProps {
  fullName?: string;
  currentUsername?: string;
  onSelectUsername: (username: string) => void;
  show: boolean;
}

export default function UsernameSuggestions({ 
  fullName = '', 
  currentUsername = '',
  onSelectUsername, 
  show
}: UsernameSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!show) {
      setSuggestions([]);
      return;
    }

    // Intelligente Auswahl: Priorisiere currentUsername wenn vorhanden und unterschiedlich vom fullName
    let inputToUse = '';
    let inputType: 'fullName' | 'username' = 'fullName';
    
    if (currentUsername && currentUsername.trim().length >= 2) {
      // Wenn currentUsername vorhanden ist und nicht leer
      const hasSpaces = currentUsername.includes(' ');
      const seemsLikeName = fullName && currentUsername.toLowerCase().includes(fullName.toLowerCase().split(' ')[0]);
      
      if (!hasSpaces && !seemsLikeName) {
        // Es sieht aus wie eine direkte Username-Eingabe (keine Leerzeichen, nicht wie ein Name)
        inputToUse = currentUsername;
        inputType = 'username';
      }
    }
    
    // Fallback auf fullName wenn currentUsername nicht geeignet ist
    if (!inputToUse && fullName && fullName.trim().length >= 2) {
      inputToUse = fullName;
      inputType = 'fullName';
    }
    
    if (!inputToUse || inputToUse.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    const generateSuggestions = async () => {
      setLoading(true);
      
      try {
        // Generiere Basis-Vorschläge abhängig vom erkannten Typ
        const baseSuggestions = generateSmartUsernameSuggestions(inputToUse, inputType);
        
        // Filtere den aktuellen Username aus den Vorschlägen
        const filteredSuggestions = baseSuggestions.filter(
          suggestion => suggestion !== currentUsername
        );
        
        if (filteredSuggestions.length === 0) {
          setSuggestions([]);
          setLoading(false);
          return;
        }
        
        // Prüfe Verfügbarkeit
        const availabilitiesPromises = filteredSuggestions.map(async (username) => {
          const exists = await checkUsernameExists(username);
          return { username, available: !exists };
        });
        
        const availabilities = await Promise.all(availabilitiesPromises);
        
        // Sammle verfügbare und nicht verfügbare Usernames
        const available = availabilities
          .filter(item => item.available)
          .map(item => item.username);
          
        const taken = availabilities
          .filter(item => !item.available)
          .map(item => item.username);
        
        // Wenn zu wenige verfügbar sind, generiere Alternativen
        let finalSuggestions = available;
        if (finalSuggestions.length < 4 && filteredSuggestions.length > 0) {
          const alternatives = generateAlternativeUsernames(filteredSuggestions[0], taken);
          
          // Prüfe auch die Alternativen
          const altAvailabilitiesPromises = alternatives.slice(0, 6).map(async (username) => {
            const exists = await checkUsernameExists(username);
            return { username, available: !exists };
          });
          
          const altAvailabilities = await Promise.all(altAvailabilitiesPromises);
          const availableAlts = altAvailabilities
            .filter(item => item.available)
            .map(item => item.username);
          
          finalSuggestions = [...finalSuggestions, ...availableAlts].slice(0, 6);
        }
        
        setSuggestions(finalSuggestions);
        
      } catch (error) {
        console.error('Fehler beim Generieren der Username-Vorschläge:', error);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(generateSuggestions, 500); // Debounce
    return () => clearTimeout(timeoutId);
  }, [fullName, currentUsername, show]);

  if (!show || suggestions.length === 0) {
    return null;
  }

  return (
    <div className={styles.suggestionsContainer}>
      <div className={styles.suggestionsHeader}>
        <span className={styles.suggestionsTitle}>💡 Vorschläge für deinen Benutzernamen:</span>
        {loading && <span className={styles.loadingText}>Prüfe Verfügbarkeit...</span>}
      </div>
      
      <div className={styles.suggestionsList}>
        {suggestions.map((username) => (
          <button
            key={username}
            type="button"
            className={`${styles.suggestionButton} ${
              currentUsername === username ? styles.selected : ''
            }`}
            onClick={() => onSelectUsername(username)}
            disabled={loading}
          >
            <span className={styles.usernameText}>{username}</span>
            <span className={styles.availableIndicator}>✓</span>
          </button>
        ))}
      </div>
      
      <div className={styles.suggestionsFooter}>
        <small className={styles.helpText}>
          Klicke auf einen Vorschlag um ihn zu verwenden, oder gib deinen eigenen ein.
        </small>
      </div>
    </div>
  );
}