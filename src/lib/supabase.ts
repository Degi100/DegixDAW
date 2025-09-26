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
    
    // Flow type für bessere Sicherheit
    flowType: 'pkce' // Proof Key for Code Exchange - sicherer für SPAs
  }
})





// Prüfe ob Benutzername bereits existiert (falls in user_metadata gespeichert)
export async function checkUsernameExists(username: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.auth.admin.listUsers()
    
    if (error) {
      console.error('Fehler beim Prüfen des Benutzernamens:', error)
      return false
    }
    
    return data.users.some(user => 
      user.user_metadata?.full_name === username || 
      user.user_metadata?.username === username
    )
  } catch (error) {
    console.error('Fehler beim Prüfen des Benutzernamens:', error)
    return false
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

