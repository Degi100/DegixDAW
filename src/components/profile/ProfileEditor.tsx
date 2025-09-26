// src/components/ui/ProfileEditor.tsx
import { useState, useEffect } from 'react';
import type { User } from '@supabase/supabase-js';
import { useForm } from '../../hooks/useForm';
import Input from '../ui/Input';
import UsernameSuggestions from '../ui/UsernameSuggestions';
import Button from '../ui/Button';
import { Spinner } from '../ui/Loading';
import { userSettingsWithPasswordSchema } from '../../lib/validation';

interface ProfileEditorProps {
  user: User;
  onSave: (data: {
    fullName: string;
    username: string;
  }) => Promise<void>;
  isUpdating: boolean;
}

export default function ProfileEditor({ user, onSave, isUpdating }: ProfileEditorProps) {
  const [showUsernameSuggestions, setShowUsernameSuggestions] = useState(false);

  const form = useForm({
    schema: userSettingsWithPasswordSchema,
    initialValues: {
      fullName: user?.user_metadata?.full_name || '',
      username: user?.user_metadata?.username || '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    },
    onSubmit: async (data) => {
      await onSave({
        fullName: data.fullName,
        username: data.username
      });
    }
  });

  // Initialize form values when user data loads
  useEffect(() => {
    if (user) {
      const currentFullName = form.values.fullName;
      const currentUsername = form.values.username;
      const newFullName = user.user_metadata?.full_name || '';
      const newUsername = user.user_metadata?.username || '';
      
      if (currentFullName !== newFullName) {
        form.setValue('fullName', newFullName);
      }
      if (currentUsername !== newUsername) {
        form.setValue('username', newUsername);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Show username suggestions when user starts editing
  useEffect(() => {
    const currentUsername = user?.user_metadata?.username || '';
    const newUsername = form.values.username;
    const fullName = form.values.fullName;
    
    const hasUsernameChange = newUsername && newUsername !== currentUsername && newUsername.length >= 2;
    const hasFullName = fullName && fullName.length >= 2;
    
    if (hasUsernameChange || hasFullName) {
      setShowUsernameSuggestions(true);
    } else {
      setShowUsernameSuggestions(false);
    }
  }, [form.values.username, form.values.fullName, user]);

  const handleUsernameSelect = (username: string) => {
    form.setValue('username', username);
    setShowUsernameSuggestions(false);
  };

  return (
    <section className="card card-large">
      <h2 className="section-title">📝 Profil-Informationen</h2>
      
      <form onSubmit={form.handleSubmit} className="form-grid">
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

        <div className="form-row">
          <Input
            {...form.getFieldProps('username')}
            type="text"
            placeholder="Benutzername"
            required
            showCheckmark
            helpText="Eindeutiger Benutzername für Ihr Profil"
          />
          {showUsernameSuggestions && (
            <UsernameSuggestions
              fullName={form.values.fullName}
              currentUsername={form.values.username}
              onSelectUsername={handleUsernameSelect}
              show={showUsernameSuggestions}
            />
          )}
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