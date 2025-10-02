// src/components/profile/PasswordChanger.tsx
import { useEffect, useCallback } from 'react';
import { useForm } from '../../hooks/useForm';
import { validateUserSettingsAsync, userSettingsWithPasswordSchema } from '../../lib/validation';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { Spinner } from '../ui/Loading';

interface PasswordChangerProps {
  onChangePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  isUpdating: boolean;
}

export default function PasswordChanger({ onChangePassword, isUpdating }: PasswordChangerProps) {
  const form = useForm({
    schema: userSettingsWithPasswordSchema,
    initialValues: {
      fullName: '',
      username: '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    },
    onSubmit: async (data) => {
      if (data.currentPassword && data.newPassword) {
        await onChangePassword(data.currentPassword, data.newPassword);
        
        // Clear password fields after successful change
        form.setValue('currentPassword', '');
        form.setValue('newPassword', '');
        form.setValue('confirmPassword', '');
      }
    }
  });

  const debouncedValidation = useCallback(async () => {
    if (!form.values.currentPassword || form.values.currentPassword.length < 3) {
      return;
    }

    try {
      const result = await validateUserSettingsAsync({
        ...form.values,
        fullName: form.values.fullName,
        username: form.values.username,
        currentPassword: form.values.currentPassword,
        newPassword: form.values.newPassword,
        confirmPassword: form.values.confirmPassword
      });

      const errors = result.errors as Record<string, string>;
      if (!result.success && errors.currentPassword) {
        form.setFieldError('currentPassword', errors.currentPassword);
      } else if (result.success) {
        if (form.errors.currentPassword) {
          form.setFieldError('currentPassword', '');
        }
      }
    } catch (error) {
      console.error('Fehler bei Passwort-Validierung:', error);
    }
  }, [form]);

  // Debounced validation for current password
  useEffect(() => {
    const timeoutId = setTimeout(debouncedValidation, 1000);
    return () => clearTimeout(timeoutId);
  }, [form.values.currentPassword, debouncedValidation]);

  const isFormFilled = form.values.currentPassword && form.values.newPassword && form.values.confirmPassword;

  return (
    <section className="card card-large">
      <h2 className="section-title">🔐 Passwort ändern</h2>
      
      <form onSubmit={form.handleSubmit}>
        <div className="form-grid">
          <div className="form-row">
            <Input
              {...form.getFieldProps('currentPassword')}
              type="password"
              placeholder="Aktuelles Passwort"
              showPasswordToggle
              showCheckmark
              required
            />
          </div>

          <div className="form-row">
            <Input
              {...form.getFieldProps('newPassword')}
              type="password"
              placeholder="Neues Passwort"
              helpText="Mindestens 6 Zeichen, mit Groß-/Kleinbuchstaben und Zahl"
              showPasswordToggle
              showCheckmark
              required
            />
          </div>

          <div className="form-row">
            <Input
              {...form.getFieldProps('confirmPassword')}
              type="password"
              placeholder="Neues Passwort bestätigen"
              showPasswordToggle
              showCheckmark
              required
            />
          </div>

          <Button
            type="submit"
            disabled={isUpdating || !isFormFilled || !form.isValid}
            variant="secondary"
            fullWidth
          >
            {isUpdating ? (
              <>
                <Spinner size="small" />
                Ändert...
              </>
            ) : (
              '🔑 Passwort ändern'
            )}
          </Button>
        </div>
      </form>
    </section>
  );
}