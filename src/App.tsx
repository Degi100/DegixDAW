import { useState } from 'react'
import { Auth } from './components/Auth'
import { DAWInterface } from './components/DAWInterface'

interface User {
  id: string
  email: string
  user_metadata?: { name?: string }
}

function App() {
  const [user, setUser] = useState<User | null>(null)

  const handleLogin = (userData: User) => {
    setUser(userData)
  }

  const handleLogout = () => {
    setUser(null)
  }

  return user ? <DAWInterface user={user} onLogout={handleLogout} /> : <Auth onLogin={handleLogin} />
}

export default App
