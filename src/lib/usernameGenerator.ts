// src/lib/usernameGenerator.ts

/**
 * Einfache Username-Generierung für Fallback (ersetzt alte generateUsername Logik)
 */
export function generateFallbackUsername(fullName: string, email: string): string {
  if (fullName.trim()) {
    return fullName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  }
  const emailName = email.split('@')[0];
  return emailName.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Generiert Username-Vorschläge basierend auf dem vollständigen Namen
 */
export function generateUsernameVariations(fullName: string): string[] {
  if (!fullName || fullName.trim().length < 2) {
    return [];
  }

  const name = fullName.trim().toLowerCase();
  const parts = name.split(' ').filter(part => part.length > 0);
  
  if (parts.length === 0) {
    return [];
  }

  const suggestions: string[] = [];
  
  // Basis-Variationen
  if (parts.length === 1) {
    // Nur ein Name
    const singleName = parts[0];
    suggestions.push(singleName);
    suggestions.push(`${singleName}${Math.floor(Math.random() * 100)}`);
    suggestions.push(`${singleName}_${Math.floor(Math.random() * 1000)}`);
    suggestions.push(`the_${singleName}`);
    suggestions.push(`${singleName}_official`);
  } else if (parts.length >= 2) {
    // Vor- und Nachname (oder mehr)
    const firstName = parts[0];
    const lastName = parts[parts.length - 1];
    
    // Klassische Kombinationen
    suggestions.push(`${firstName}_${lastName}`);
    suggestions.push(`${firstName}${lastName}`);
    suggestions.push(`${lastName}_${firstName}`);
    
    // Initialen + Name
    suggestions.push(`${firstName[0]}${lastName}`);
    suggestions.push(`${firstName}${lastName[0]}`);
    
    // Mit Zahlen
    suggestions.push(`${firstName}${lastName}${Math.floor(Math.random() * 100)}`);
    suggestions.push(`${firstName}_${Math.floor(Math.random() * 1000)}`);
    
    // Kreative Variationen
    suggestions.push(`${firstName}.${lastName}`);
    suggestions.push(`${lastName}.${firstName}`);
    suggestions.push(`${firstName}-${lastName}`);
    
    // Mit Präfixen/Suffixes
    suggestions.push(`the_${firstName}`);
    suggestions.push(`${firstName}_official`);
    suggestions.push(`${firstName}_dev`);
    suggestions.push(`${firstName}_music`);
  }

  // Bereinigen und deduplizieren
  const cleanSuggestions = suggestions
    .map(username => cleanUsername(username))
    .filter(username => username.length >= 3 && username.length <= 20)
    .filter((username, index, array) => array.indexOf(username) === index) // Duplikate entfernen
    .slice(0, 6); // Maximal 6 Vorschläge

  return cleanSuggestions;
}

/**
 * Bereinigt einen Username nach den Regeln
 */
export function cleanUsername(username: string): string {
  return username
    .toLowerCase()
    .replace(/[^a-z0-9-_.]/g, '') // Nur erlaubte Zeichen
    .replace(/[_.]{2,}/g, '_') // Mehrfache Unterstriche/Punkte reduzieren
    .replace(/^[_.-]|[_.-]$/g, ''); // Keine Sonderzeichen am Anfang/Ende
}

/**
 * Generiert zusätzliche Vorschläge wenn die ersten bereits vergeben sind
 */
export function generateAlternativeUsernames(baseUsername: string, takenUsernames: string[]): string[] {
  const alternatives: string[] = [];
  
  // Mit Zahlen erweitern
  for (let i = 1; i <= 20; i++) {
    const variant = `${baseUsername}${i}`;
    if (!takenUsernames.includes(variant)) {
      alternatives.push(variant);
    }
    
    const variantUnderscore = `${baseUsername}_${i}`;
    if (!takenUsernames.includes(variantUnderscore)) {
      alternatives.push(variantUnderscore);
    }
  }
  
  // Mit Jahr erweitern
  const currentYear = new Date().getFullYear();
  const yearVariants = [
    `${baseUsername}${currentYear}`,
    `${baseUsername}_${currentYear}`,
    `${baseUsername}${currentYear.toString().slice(-2)}` // Letzten 2 Ziffern
  ];
  
  yearVariants.forEach(variant => {
    if (!takenUsernames.includes(variant)) {
      alternatives.push(variant);
    }
  });
  
  // Mit Präfixen
  const prefixes = ['the_', 'mr_', 'ms_', 'user_'];
  prefixes.forEach(prefix => {
    const variant = `${prefix}${baseUsername}`;
    if (variant.length <= 20 && !takenUsernames.includes(variant)) {
      alternatives.push(variant);
    }
  });
  
  return alternatives.slice(0, 8); // Maximal 8 Alternativen
}

/**
 * Generiert kreative Variationen aus beliebigen Eingaben (Fantasienamen, Wörter, etc.)
 */
export function generateCreativeVariations(input: string): string[] {
  if (!input || input.trim().length < 2) {
    return [];
  }

  const baseWord = cleanUsername(input.trim());
  if (baseWord.length < 2) return [];

  const suggestions: string[] = [];
  
  // Basis-Variationen
  suggestions.push(baseWord);
  
  // Mit Zahlen (zufällig und systematisch)
  const randomNum = Math.floor(Math.random() * 100);
  const randomNum2 = Math.floor(Math.random() * 1000);
  suggestions.push(`${baseWord}${randomNum}`);
  suggestions.push(`${baseWord}_${randomNum2}`);
  suggestions.push(`${baseWord}123`);
  suggestions.push(`${baseWord}_2025`);
  
  // Mit kreativen Präfixen
  const creativePrefixes = ['the_', 'cool_', 'real_', 'super_', 'amazing_', 'best_', 'true_', 'fresh_'];
  const randomPrefix = creativePrefixes[Math.floor(Math.random() * creativePrefixes.length)];
  suggestions.push(`${randomPrefix}${baseWord}`);
  suggestions.push(`the_${baseWord}`);
  
  // Mit kreativen Suffixen
  const creativeSuffixes = ['_king', '_queen', '_master', '_pro', '_legend', '_star', '_hero', '_ace', '_ninja', '_wizard'];
  const randomSuffix = creativeSuffixes[Math.floor(Math.random() * creativeSuffixes.length)];
  suggestions.push(`${baseWord}${randomSuffix}`);
  suggestions.push(`${baseWord}_official`);
  suggestions.push(`${baseWord}_original`);
  
  // Wortspiele und Variationen
  if (baseWord.length >= 4) {
    // Rückwärts
    const reversed = baseWord.split('').reverse().join('');
    if (reversed !== baseWord) {
      suggestions.push(reversed);
      suggestions.push(`${baseWord}_${reversed}`);
    }
    
    // Erste und letzte Buchstaben vertauschen
    if (baseWord.length >= 4) {
      const swapped = baseWord[baseWord.length - 1] + baseWord.slice(1, -1) + baseWord[0];
      if (swapped !== baseWord) {
        suggestions.push(swapped);
      }
    }
  }
  
  // Verdoppelung für kurze Wörter
  if (baseWord.length <= 6) {
    suggestions.push(`${baseWord}${baseWord}`);
    suggestions.push(`${baseWord}_${baseWord}`);
  }
  
  // Mit "x" und "z" für coolen Sound
  suggestions.push(`${baseWord}x`);
  suggestions.push(`x${baseWord}`);
  suggestions.push(`${baseWord}z`);
  
  // Bereinigen und deduplizieren
  const cleanSuggestions = suggestions
    .map(username => cleanUsername(username))
    .filter(username => username.length >= 3 && username.length <= 20)
    .filter((username, index, array) => array.indexOf(username) === index) // Duplikate entfernen
    .filter(username => username !== baseWord || suggestions.indexOf(username) === 0) // Original nur einmal
    .slice(0, 8); // Maximal 8 Vorschläge

  return cleanSuggestions;
}

/**
 * Intelligente Username-Generierung die zwischen Namen und Fantasiewörtern unterscheidet
 */
export function generateSmartUsernameSuggestions(input: string, inputType: 'fullName' | 'username' = 'username'): string[] {
  if (!input || input.trim().length < 2) {
    return [];
  }

  if (inputType === 'fullName') {
    // Wenn es ein vollständiger Name ist (enthält Leerzeichen oder ist explizit als fullName markiert)
    return generateUsernameVariations(input);
  } else {
    // Wenn es eine direkte Username-Eingabe ist
    return generateCreativeVariations(input);
  }
}

/**
 * Prüft ob ein Username den Regeln entspricht
 */
export function isValidUsername(username: string): boolean {
  if (!username) return false;
  if (username.length < 3 || username.length > 20) return false;
  if (!/^[a-z0-9-_]+$/.test(username)) return false;
  if (/^[_.-]|[_.-]$/.test(username)) return false;
  
  return true;
}