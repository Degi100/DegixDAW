// Hole das Profil eines Users anhand der user_id
export async function getProfileByUserId(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single();
  return { data, error };
}
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://xcdzugnjzrkngzmtzeip.supabase.co'
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjZHp1Z25qenJrbmd6bXR6ZWlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3MzY4NjAsImV4cCI6MjA3NDMxMjg2MH0.5W99cq4lNO_5XqVWkGJ8_q4C6PzD0gSKnJjj37NU-rU'

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    // Session Storage Konfiguration
    storage: window.localStorage, // Oder sessionStorage für weniger Persistenz
    autoRefreshToken: true, // Automatisches Token-Refresh
    persistSession: true, // Session über Browser-Restart beibehalten
    detectSessionInUrl: true, // OAuth Callbacks erkennen
    
    // Fallback to implicit flow for better compatibility
    flowType: 'implicit' // Weniger streng als PKCE, besser für Tests
  }
})





// Prüfe ob Benutzername bereits existiert (vereinfachte Version für Client-Side)
export async function checkUsernameExists(username: string): Promise<boolean> {
  try {
    // Query auf die Tabelle 'profiles', um zu prüfen, ob der Username existiert
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .single();
    if (error && error.code !== 'PGRST116') { // PGRST116 = Row not found
      console.error('Fehler beim Prüfen des Benutzernamens:', error);
      return false;
    }
    return !!data;
  } catch (error) {
    console.error('Fehler beim Prüfen des Benutzernamens:', error);
    return false;
  }
}

// Prüfe ob das aktuelle Passwort korrekt ist
export async function verifyCurrentPassword(password: string): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user?.email) {
      return false
    }
    
    // Versuche sich mit dem aktuellen Passwort anzumelden
    const { error } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: password
    })
    
    // Wenn kein Fehler, dann ist das Passwort korrekt
    return !error
  } catch (error) {
    console.error('Fehler beim Prüfen des aktuellen Passworts:', error)
    return false
  }
}

