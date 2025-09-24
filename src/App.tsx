import { useAuth } from './hooks/useAuth'
import { Auth } from './components/Auth'
import { DAWInterface } from './components/DAWInterface'

function App() {
  const { user, loading } = useAuth()

  console.log('App render - user:', user, 'loading:', loading)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return user ? <DAWInterface /> : <Auth />
}

export default App
