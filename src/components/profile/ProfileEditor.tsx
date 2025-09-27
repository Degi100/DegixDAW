// src/components/ui/ProfileEditor.tsx

// src/components/ui/ProfileEditor.tsx
// ...existing code...
import type { User } from '@supabase/supabase-js';
import { useForm } from '../../hooks/useForm';
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


  return (
    <section className="card card-large">
      <h2 className="section-title">📝 Profil-Informationen</h2>
      
      <form onSubmit={form.handleSubmit} className="form-grid">
        {/* Username Field (Read-only) */}
        <div className="username-field">
          <label className="form-label">Benutzername</label>
          <div className="username-display">
            <span className="username-value">@{user.user_metadata?.username || 'Nicht festgelegt'}</span>
            <small className="username-note">
              🔒 Benutzername kann nicht geändert werden
            </small>
          </div>
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