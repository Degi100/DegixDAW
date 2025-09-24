import { AlertCircle, LogIn, Music } from 'lucide-react'

interface User {
  id: string
  email: string
  user_metadata?: { name?: string }
}

interface AuthProps {
  onLogin: (user: User) => void
}

export function Auth({ onLogin }: AuthProps) {
  // Check if Supabase is configured
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
  const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey && 
    supabaseUrl !== 'your_supabase_project_url' && 
    supabaseAnonKey !== 'your_supabase_anon_key')

  const handleGoogleLogin = async () => {
    if (!isSupabaseConfigured) {
      // Mock login for development
      const mockUser = {
        id: 'mock-user-id',
        email: 'demo@degixdaw.com',
        user_metadata: { name: 'Demo User' }
      }
      onLogin(mockUser)
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

  const handleDiscordLogin = async () => {
    if (!isSupabaseConfigured) {
      // Mock login for development
      const mockUser = {
        id: 'mock-user-id', 
        email: 'demo@degixdaw.com',
        user_metadata: { name: 'Demo User' }
      }
      onLogin(mockUser)
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto h-16 w-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mb-4">
              <Music className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-4xl font-bold text-white mb-2">🎧 DegixDAW</h2>
            <p className="text-lg text-gray-300 mb-2">
              <strong>D</strong>AW-integrated, <strong>E</strong>ffortless, <strong>G</strong>lobal, <strong>I</strong>nstant e<strong>X</strong>change
            </p>
            <p className="text-sm text-gray-400">
              Web-DAW für spontane Ideen → direkt in Cubase via VST
            </p>
          </div>

          {!isSupabaseConfigured && (
            <div className="bg-yellow-900 border border-yellow-600 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-yellow-400" />
                <span className="text-yellow-100 text-sm font-medium">Demo Mode</span>
              </div>
              <p className="text-yellow-200 text-xs mt-1">
                Configure Supabase credentials in .env.local for full authentication
              </p>
            </div>
          )}

          <div className="space-y-4">
            <button
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 transition-colors"
            >
              <LogIn className="h-4 w-4 mr-2" />
              {isSupabaseConfigured ? 'Sign in with Google' : 'Demo Login (Google)'}
            </button>

            <button
              onClick={handleDiscordLogin}
              className="w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
            >
              <LogIn className="h-4 w-4 mr-2" />
              {isSupabaseConfigured ? 'Sign in with Discord' : 'Demo Login (Discord)'}
            </button>
          </div>

          <div className="mt-8 text-center text-sm text-gray-400">
            <p>Features:</p>
            <ul className="mt-2 space-y-1">
              <li>✅ Login (Google/Discord)</li>
              <li>🔜 Audio/MIDI-Aufnahme</li>
              <li>🔜 Cloud-Speicher (Supabase)</li>
              <li>🔜 VST-Plugin</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}