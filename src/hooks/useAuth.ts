import { useState, useEffect } from 'react'

// Mock User interface for development
interface MockUser {
  id: string
  email: string
  user_metadata?: { name?: string }
}

// Check if Supabase is configured
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey && 
  supabaseUrl !== 'your_supabase_project_url' && 
  supabaseAnonKey !== 'your_supabase_anon_key')

export function useAuth() {
  const [user, setUser] = useState<MockUser | null>(null)
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  console.log('useAuth hook render - user:', user, 'loading:', loading)

  useEffect(() => {
    console.log('useAuth useEffect called')
    if (!isSupabaseConfigured) {
      // Mock authentication for development - immediately set to not loading
      console.log('Supabase not configured, setting loading to false')
      setLoading(false)
      return
    }

    // Only import and use Supabase if properly configured
    const initAuth = async () => {
      try {
        const { createClient } = await import('@supabase/supabase-js')
        const supabase = createClient(supabaseUrl!, supabaseAnonKey!)

        // Get initial session
        const { data: { session } } = await supabase.auth.getSession()
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
          setSession(session)
          setUser(session?.user ?? null)
          setLoading(false)
        })

        return () => subscription.unsubscribe()
      } catch (error) {
        console.error('Failed to initialize Supabase:', error)
        setLoading(false)
      }
    }

    initAuth()
  }, [])

  const signInWithGoogle = async () => {
    console.log('signInWithGoogle called, isSupabaseConfigured:', isSupabaseConfigured)
    if (!isSupabaseConfigured) {
      // Mock login for development
      const mockUser: MockUser = {
        id: 'mock-user-id',
        email: 'demo@degixdaw.com',
        user_metadata: { name: 'Demo User' }
      }
      console.log('Setting mock user:', mockUser)
      setUser(mockUser)
      console.log('User state should be updated now')
      return
    }

    try {
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(supabaseUrl!, supabaseAnonKey!)
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
      })
      if (error) throw error
    } catch (error) {
      console.error('Error signing in with Google:', error)
    }
  }

  const signInWithDiscord = async () => {
    if (!isSupabaseConfigured) {
      // Mock login for development
      const mockUser: MockUser = {
        id: 'mock-user-id',
        email: 'demo@degixdaw.com',
        user_metadata: { name: 'Demo User' }
      }
      setUser(mockUser)
      return
    }

    try {
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(supabaseUrl!, supabaseAnonKey!)
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'discord',
      })
      if (error) throw error
    } catch (error) {
      console.error('Error signing in with Discord:', error)
    }
  }

  const signOut = async () => {
    if (!isSupabaseConfigured) {
      // Mock logout for development
      setUser(null)
      setSession(null)
      return
    }

    try {
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(supabaseUrl!, supabaseAnonKey!)
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return {
    user,
    session,
    loading,
    signInWithGoogle,
    signInWithDiscord,
    signOut,
    isSupabaseConfigured,
  }
}