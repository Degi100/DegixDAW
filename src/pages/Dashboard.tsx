// src/pages/Dashboard.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };

    checkUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <div style={{ 
      padding: '2rem',
      fontFamily: 'sans-serif',
      maxWidth: '800px',
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
        <h1>
          👋 {user ? `Willkommen, ${user.user_metadata?.display_name || user.user_metadata?.username || user.email}!` : 'Willkommen bei DegixDAW!'}
        </h1>
        <div>
          {user ? (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                onClick={() => navigate('/settings')}
                style={{ 
                  padding: '0.5rem 1rem', 
                  backgroundColor: '#6B7280', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '4px', 
                  cursor: 'pointer'
                }}
              >
                ⚙️ Einstellungen
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
          ) : (
            <button 
              onClick={() => navigate('/login')}
              style={{ 
                padding: '0.5rem 1rem', 
                backgroundColor: '#4F46E5', 
                color: 'white', 
                border: 'none', 
                borderRadius: '4px', 
                cursor: 'pointer'
              }}
            >
              Anmelden
            </button>
          )}
        </div>
      </header>

      <section>
        <h2>🎵 Öffentliche Beispiele</h2>
        <p style={{ color: '#666' }}>Hier finden Sie öffentlich geteilte Audio- und MIDI-Aufnahmen von anderen Nutzern</p>
        <div style={{ 
          padding: '1rem', 
          backgroundColor: '#f8f9fa', 
          borderRadius: '6px', 
          marginTop: '1rem' 
        }}>
          <p style={{ margin: 0, fontStyle: 'italic', color: '#6c757d' }}>
            📅 Coming soon: Demo-Tracks und Community-Beiträge
          </p>
        </div>
      </section>

      {user ? (
        <section style={{ marginTop: '2rem' }}>
          <h2>🎼 Meine Ideen</h2>
          <p style={{ color: '#666' }}>Ihre persönlich gespeicherten Audio- und MIDI-Aufnahmen</p>
          <div style={{ 
            padding: '1rem', 
            backgroundColor: '#f8f9fa', 
            borderRadius: '6px', 
            marginTop: '1rem' 
          }}>
            <p style={{ margin: 0, fontStyle: 'italic', color: '#6c757d' }}>
              📁 Ihre Bibliothek wird hier angezeigt
            </p>
          </div>
        </section>
      ) : (
        <section style={{ marginTop: '2rem' }}>
          <h2>🔐 Melden Sie sich an für mehr Funktionen</h2>
          <div style={{ 
            padding: '1.5rem', 
            backgroundColor: '#fff3cd', 
            border: '1px solid #ffeaa7', 
            borderRadius: '6px', 
            marginTop: '1rem' 
          }}>
            <h3 style={{ margin: '0 0 1rem 0', color: '#856404' }}>Mit einem Account können Sie:</h3>
            <ul style={{ color: '#856404', paddingLeft: '1.5rem' }}>
              <li>Ihre eigenen Audio- und MIDI-Aufnahmen speichern</li>
              <li>Ideen mit anderen teilen</li>
              <li>Favoriten markieren</li>
              <li>An Community-Projekten teilnehmen</li>
            </ul>
            <button 
              onClick={() => navigate('/login')}
              style={{ 
                marginTop: '1rem',
                padding: '0.75rem 1.5rem', 
                backgroundColor: '#4F46E5', 
                color: 'white', 
                border: 'none', 
                borderRadius: '4px', 
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              Jetzt anmelden
            </button>
          </div>
        </section>
      )}
    </div>
  );
}