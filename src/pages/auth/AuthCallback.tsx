// src/pages/AuthCallback.tsx
// ...existing code...
import { useAuthCallback } from '../../hooks/useAuthCallback';

export default function AuthCallback() {
  useAuthCallback();
  return (
    <div style={{ 
      padding: '2rem', 
      textAlign: 'center',
      fontFamily: 'sans-serif'
    }}>
      <h2>Wird weitergeleitet... 🎶</h2>
      <p>Wenn es nicht funktioniert, kehre zur <a href="/login">Login-Seite</a> zurück.</p>
    </div>
  );
}
// ...existing code...