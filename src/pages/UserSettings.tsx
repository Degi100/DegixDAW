// src/pages/UserSettings.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

export default function UserSettings() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/login');
        return;
      }
      
      setUser(user);
      // Supabase speichert user metadata in user.user_metadata
      setUsername(user.user_metadata?.username || '');
      setFullName(user.user_metadata?.full_name || '');
      setDisplayName(user.user_metadata?.display_name || '');
      setLoading(false);
    };

    checkUser();
  }, [navigate]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          username: username.trim(),
          full_name: fullName.trim(),
          display_name: displayName.trim() || username.trim()
        }
      });

      if (error) throw error;
      alert('✅ Profil erfolgreich aktualisiert!');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Ein Fehler ist aufgetreten';
      alert(`Fehler: ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  if (loading) {
    return (
      <div style={{ 
        padding: '2rem', 
        textAlign: 'center',
        fontFamily: 'sans-serif'
      }}>
        <h2>Lädt Benutzereinstellungen...</h2>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div style={{ 
      padding: '2rem',
      fontFamily: 'sans-serif',
      maxWidth: '600px',
      margin: '0 auto'
    }}>
      <header style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '2rem',
        borderBottom: '1px solid #eee',
        paddingBottom: '1rem'
      }}>
        <h1>⚙️ Benutzereinstellungen</h1>
        <div>
          <button 
            onClick={() => navigate('/')}
            style={{ 
              padding: '0.5rem 1rem', 
              backgroundColor: '#6B7280', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px', 
              cursor: 'pointer',
              marginRight: '0.5rem'
            }}
          >
            Zurück
          </button>
          <button 
            onClick={handleLogout}
            style={{ 
              padding: '0.5rem 1rem', 
              backgroundColor: '#EF4444', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px', 
              cursor: 'pointer'
            }}
          >
            Abmelden
          </button>
        </div>
      </header>

      <div style={{ 
        backgroundColor: '#f8f9fa', 
        padding: '2rem', 
        borderRadius: '8px',
        marginBottom: '2rem'
      }}>
        <h3 style={{ marginTop: 0 }}>📧 Account-Informationen</h3>
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Registriert:</strong> {new Date(user.created_at).toLocaleDateString('de-DE')}</p>
        <p><strong>Letzte Anmeldung:</strong> {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString('de-DE') : 'Nie'}</p>
      </div>

      <form onSubmit={handleSave} style={{ 
        backgroundColor: 'white', 
        padding: '2rem', 
        borderRadius: '8px',
        border: '1px solid #e5e5e5'
      }}>
        <h3 style={{ marginTop: 0 }}>👤 Profil bearbeiten</h3>
        
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            Vollständiger Name:
          </label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '1rem',
              boxSizing: 'border-box'
            }}
            placeholder="z.B. Max Mustermann"
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            Benutzername:
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '1rem',
              boxSizing: 'border-box'
            }}
            placeholder="z.B. max-mustermann"
            required
          />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            Anzeigename:
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '1rem',
              boxSizing: 'border-box'
            }}
            placeholder="Wie sollen andere Sie sehen?"
          />
          <small style={{ color: '#666', fontSize: '0.9rem' }}>
            Falls leer, wird der Benutzername verwendet
          </small>
        </div>

        <button
          type="submit"
          disabled={saving}
          style={{
            width: '100%',
            padding: '0.75rem',
            backgroundColor: '#10B981',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '1rem',
            cursor: saving ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.6 : 1
          }}
        >
          {saving ? 'Speichert...' : '💾 Änderungen speichern'}
        </button>
      </form>
    </div>
  );
}