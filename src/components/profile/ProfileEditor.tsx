// src/components/ui/ProfileEditor.tsx

// src/components/ui/ProfileEditor.tsx
// ...existing code...
import type { User } from '@supabase/supabase-js';
import { useState } from 'react';
import { useForm } from '../../hooks/useForm';
import { useProfile } from '../../hooks/useProfile';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { Spinner } from '../ui/Loading';
import { userSettingsSchema } from '../../lib/validation/profileValidation';

interface ProfileEditorProps {
  user: User;
  onSave: (data: {
    fullName: string;
  }) => Promise<void>;
  isUpdating: boolean;
}

export default function ProfileEditor({ user, onSave, isUpdating }: ProfileEditorProps) {
  const form = useForm({
    schema: userSettingsSchema,
    initialValues: {
      fullName: user?.user_metadata?.full_name || '',
    },
    onSubmit: async (data) => {
      await onSave({
        fullName: data.fullName,
      });
    }
  });

  // Initialize form values when user data loads
  // ...existing code...

  // Show username suggestions when user starts editing


  // Username darf nur geändert werden, wenn:
  // - username_can_change === true
  // - username_changed !== true
  const usernameCanChange = user.user_metadata?.username_can_change === true;
  const usernameChanged = user.user_metadata?.username_changed === true;

  // Username-Änderung nur erlauben, wenn erlaubt und noch nicht geändert
  const allowUsernameEdit = usernameCanChange && !usernameChanged;
  const [newUsername, setNewUsername] = useState(user.user_metadata?.username || '');
  const [usernameError, setUsernameError] = useState('');
  const { updateProfile } = useProfile(user);

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewUsername(e.target.value);
    setUsernameError('');
  };

  const handleUsernameSave = async () => {
    // Validierung: Username muss Format erfüllen und darf nicht vergeben sein
    const { validateUsernameFormat } = await import('../../lib/validation/authValidation');
    const validation = validateUsernameFormat(newUsername);
    if (!validation.valid) {
      setUsernameError(validation.error || 'Ungültiger Benutzername');
      return;
    }
    const { checkUsernameExists } = await import('../../lib/supabase');
    const exists = await checkUsernameExists(newUsername);
    if (exists) {
      setUsernameError('Dieser Benutzername ist bereits vergeben');
      return;
    }
    // Username speichern und Flags setzen/entfernen
    await updateProfile({ username: newUsername, full_name: user.user_metadata?.full_name || '' });
    // Schreibe die Flags ins Auth-Metadata
    const { supabase } = await import('../../lib/supabase');
    await supabase.auth.updateUser({ data: { username_changed: true, username_can_change: false } });
    setUsernameError('');
    window.location.reload(); // Aktualisiere die Ansicht
  };

  return (
    <section className="card card-large">
      <h2 className="section-title">📝 Profil-Informationen</h2>
      <form onSubmit={form.handleSubmit} className="form-grid">
        {/* Username Field */}
        <div className="username-field">
          <label className="form-label">Benutzername</label>
          <small className="username-hint" style={{ color: '#888', display: 'block', marginBottom: '8px' }}>
            Hinweis: Du kannst deinen Benutzernamen nur <b>einmalig</b> ändern. Wenn du den automatisch vergebenen Vorschlag behältst, bleibt die Option zur einmaligen Änderung erhalten.
          </small>
          {allowUsernameEdit ? (
            <div className="username-edit">
              <Input
                type="text"
                value={newUsername}
                onChange={handleUsernameChange}
                placeholder="Neuen Benutzernamen wählen"
                required
                helpText="Du kannst deinen Benutzernamen nur einmal ändern."
              />
              {usernameError && <small className="error-text">{usernameError}</small>}
              <Button type="button" variant="primary" onClick={handleUsernameSave} disabled={isUpdating}>
                Speichern
              </Button>
            </div>
          ) : (
            <div className="username-display">
              <span className="username-value">@{user.user_metadata?.username || 'Nicht festgelegt'}</span>
              <small className="username-note">
                🔒 Benutzername kann nicht mehr geändert werden
              </small>
            </div>
          )}
        </div>

        <div className="form-row">
          <Input
            {...form.getFieldProps('fullName')}
            type="text"
            placeholder="Vollständiger Name"
            required
            showCheckmark
            helpText="Wird als Anzeigename verwendet"
          />
        </div>

        <div className="email-field">
          <label className="form-label">Email-Adresse</label>
          <div className="email-display">
            <span className="email-value">{user.email}</span>
            <small className="email-note">
              📧 Email-Änderungen sind derzeit nicht verfügbar
            </small>
          </div>
        </div>

        <Button
          type="submit"
          disabled={isUpdating}
          variant="primary"
          fullWidth
        >
          {isUpdating ? (
            <>
              <Spinner size="small" />
              Speichert...
            </>
          ) : (
            '💾 Profil speichern'
          )}
        </Button>
      </form>
    </section>
  );
}