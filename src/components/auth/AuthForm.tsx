// src/components/ui/AuthForm.tsx
import { useForm } from '../../hooks/useForm';
import { useFormToggle, getToggleLabels, LOGIN_SIGNUP_LABELS } from '../../hooks/useFormToggle';
import { signInSchema, signUpSchema, validateSignUpAsync } from '../../lib/validation';
import Button from '../ui/Button';
import Input from '../ui/Input';
import UsernameSuggestions from '../ui/UsernameSuggestions';
import { Spinner } from '../ui/Loading';
import styles from './AuthForm.module.css';

interface AuthFormProps {
  onLogin: (email: string, password: string) => Promise<void>;
  onSignup: (data: {
    email: string;
    password: string;
    fullName: string;
    username: string;
  }) => Promise<void>;
  isSubmitting: boolean;
}

export default function AuthForm({ onLogin, onSignup, isSubmitting }: AuthFormProps) {
  // Login Form
  const loginForm = useForm({
    schema: signInSchema,
    initialValues: { email: '', password: '' },
    onSubmit: async (data) => {
      await onLogin(data.email, data.password);
    }
  });

  // Signup Form
  const signupForm = useForm({
    schema: signUpSchema,
    initialValues: { 
      email: '', 
      password: '', 
      confirmPassword: '', 
      fullName: '', 
      username: '' 
    },
    onSubmit: async (data) => {
      // Erst async Validierung
      const validationResult = await validateSignUpAsync(data);
      
      if (!validationResult.success) {
        signupForm.setErrors(validationResult.errors);
        return;
      }
      
      await onSignup({
        email: data.email,
        password: data.password,
        fullName: data.fullName,
        username: data.username || ''
      });
    }
  });

  // Form toggle logic (Login/Signup)
  const formToggle = useFormToggle({
    initialState: true, // true = Login, false = Signup
    onToggle: () => {
      // Reset forms when switching
      loginForm.reset();
      signupForm.reset();
    }
  });

  const isLogin = formToggle.isFirstOption;
  const currentForm = isLogin ? loginForm : signupForm;

  // Username suggestions logic
  const shouldShowUsernameSuggestions = !isLogin && Boolean(
    (signupForm.values.fullName && signupForm.values.fullName.trim().length >= 2) ||
    (signupForm.values.username && signupForm.values.username.trim().length >= 2)
  );

  const handleUsernameSelect = (username: string) => {
    signupForm.setValue('username', username);
  };

  return (
    <div className={styles.formSection}>
      <h3 className={styles.formTitle}>
        {getToggleLabels(LOGIN_SIGNUP_LABELS, isLogin).primaryLabel} mit Email
      </h3>
      
      <form onSubmit={currentForm.handleSubmit} className={styles.form}>
        {!isLogin && (
          <>
            <Input
              {...signupForm.getFieldProps('fullName')}
              type="text"
              placeholder="Vollständiger Name"
              required
              showCheckmark
            />
            
            <Input
              {...signupForm.getFieldProps('username')}
              type="text"
              placeholder="Benutzername"
              helpText="Optional - wird automatisch generiert falls leer"
              showCheckmark
            />
            
            <UsernameSuggestions
              fullName={signupForm.values.fullName}
              currentUsername={signupForm.values.username || ''}
              onSelectUsername={handleUsernameSelect}
              show={shouldShowUsernameSuggestions}
            />
          </>
        )}
        
        <Input
          {...currentForm.getFieldProps('email')}
          type="email"
          placeholder="Email-Adresse"
          required
          showCheckmark
        />
        
        <Input
          {...currentForm.getFieldProps('password')}
          type="password"
          placeholder="Passwort"
          required
          showPasswordToggle
          showCheckmark
          helpText={!isLogin ? "Mindestens 6 Zeichen, mit Groß-/Kleinbuchstaben und Zahl" : undefined}
        />

        {!isLogin && (
          <Input
            {...signupForm.getFieldProps('confirmPassword')}
            type="password"
            placeholder="Passwort bestätigen"
            required
            showPasswordToggle
            showCheckmark
          />
        )}
        
        <Button
          type="submit"
          disabled={currentForm.isSubmitting || isSubmitting}
          variant={isLogin ? "success" : "primary"}
          fullWidth
        >
          {currentForm.isSubmitting || isSubmitting ? (
            <>
              <Spinner size="small" />
              Lädt...
            </>
          ) : (
            getToggleLabels(LOGIN_SIGNUP_LABELS, isLogin).primaryLabel
          )}
        </Button>
      </form>
      
      <div className={styles.toggleText}>
        {getToggleLabels(LOGIN_SIGNUP_LABELS, isLogin).promptLabel}{' '}
        <button
          onClick={formToggle.toggle}
          className={styles.toggleButton}
          type="button"
        >
          {getToggleLabels(LOGIN_SIGNUP_LABELS, isLogin).actionLabel}
        </button>
      </div>
    </div>
  );
}