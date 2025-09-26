// src/lib/usernameGenerator.ts

/**
 * Einfache Username-Generierung für Fallback (ersetzt alte generateUsername Logik)
 */
export function generateFallbackUsername(fullName: string, email: string): string {
  if (fullName.trim()) {
    return cleanUsername(fullName.replace(/\s+/g, '-'));
  }
  const emailName = email.split('@')[0];
  return cleanUsername(emailName);
}

/**
 * Intelligente Username-Generierung die zwischen Namen und Fantasiewörtern unterscheidet
 */
export function generateSmartUsernameSuggestions(input: string, inputType: 'fullName' | 'username' = 'username'): string[] {
  if (!input || input.trim().length < 2) {
    return [];
  }

  if (inputType === 'fullName') {
    return generateFromName(input);
  } else {
    return generateFromWord(input);
  }
}

/**
 * Generiert zusätzliche Vorschläge wenn die ersten bereits vergeben sind
 */
export function generateAlternativeUsernames(baseUsername: string, takenUsernames: string[]): string[] {
  const alternatives: string[] = [];
  
  // Mit Zahlen erweitern
  for (let i = 1; i <= 10; i++) {
    const variants = [
      `${baseUsername}${i}`,
      `${baseUsername}_${i}`
    ];
    
    variants.forEach(variant => {
      if (!takenUsernames.includes(variant) && alternatives.length < 6) {
        alternatives.push(variant);
      }
    });
  }
  
  // Mit Jahr erweitern
  const currentYear = new Date().getFullYear();
  const yearVariants = [
    `${baseUsername}${currentYear}`,
    `${baseUsername}_${currentYear.toString().slice(-2)}`
  ];
  
  yearVariants.forEach(variant => {
    if (!takenUsernames.includes(variant) && alternatives.length < 6) {
      alternatives.push(variant);
    }
  });
  
  return alternatives;
}

// ===== PRIVATE HELPER FUNCTIONS =====

/**
 * Bereinigt einen Username nach den Regeln
 */
function cleanUsername(username: string): string {
  return username
    .toLowerCase()
    .replace(/[^a-z0-9-_.]/g, '') // Nur erlaubte Zeichen
    .replace(/[_.]{2,}/g, '_') // Mehrfache Unterstriche/Punkte reduzieren
    .replace(/^[_.-]|[_.-]$/g, ''); // Keine Sonderzeichen am Anfang/Ende
}

/**
 * Generiert Vorschläge aus einem vollständigen Namen
 */
function generateFromName(fullName: string): string[] {
  const name = fullName.trim().toLowerCase();
  const parts = name.split(' ').filter(part => part.length > 0);
  
  if (parts.length === 0) return [];
  
  const suggestions: string[] = [];
  
  if (parts.length === 1) {
    // Nur ein Name
    const singleName = parts[0];
    suggestions.push(singleName);
    suggestions.push(`${singleName}_${randomNumber(100)}`);
    suggestions.push(`the_${singleName}`);
    suggestions.push(`${singleName}_official`);
  } else {
    // Vor- und Nachname
    const firstName = parts[0];
    const lastName = parts[parts.length - 1];
    
    suggestions.push(`${firstName}_${lastName}`);
    suggestions.push(`${firstName}${lastName}`);
    suggestions.push(`${firstName[0]}${lastName}`);
    suggestions.push(`${firstName}_${randomNumber(1000)}`);
    suggestions.push(`${firstName}.${lastName}`);
    suggestions.push(`the_${firstName}`);
  }

  return dedupeAndClean(suggestions);
}

/**
 * Generiert kreative Vorschläge aus einem Wort/Begriff
 */
function generateFromWord(input: string): string[] {
  const baseWord = cleanUsername(input.trim());
  if (baseWord.length < 2) return [];

  const suggestions: string[] = [];
  
  // Basis-Variationen
  suggestions.push(baseWord);
  suggestions.push(`${baseWord}_${randomNumber(100)}`);
  suggestions.push(`${baseWord}123`);
  
  // Mit Präfixen/Suffixen
  const prefixes = ['the_', 'cool_', 'real_'];
  const suffixes = ['_pro', '_star', '_official'];
  
  suggestions.push(`${prefixes[0]}${baseWord}`);
  suggestions.push(`${baseWord}${suffixes[0]}`);
  
  // Kreative Variationen
  if (baseWord.length <= 6) {
    suggestions.push(`${baseWord}${baseWord}`);
  }
  suggestions.push(`${baseWord}x`);

  return dedupeAndClean(suggestions);
}

/**
 * Hilfsfunktionen
 */
function randomNumber(max: number): number {
  return Math.floor(Math.random() * max);
}

function dedupeAndClean(suggestions: string[]): string[] {
  return suggestions
    .map(username => cleanUsername(username))
    .filter(username => username.length >= 3 && username.length <= 20)
    .filter((username, index, array) => array.indexOf(username) === index)
    .slice(0, 6);
}