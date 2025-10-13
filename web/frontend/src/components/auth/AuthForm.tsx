// src/components/ui/AuthForm.tsx
import { useForm } from '../../hooks/useForm';
import { useFormToggle, getToggleLabels, LOGIN_SIGNUP_LABELS } from '../../hooks/useFormToggle';
import { signInSchema, signUpSchema, validateSignUpAsync, type SignUpFormData } from '../../lib/validation';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { Spinner } from '../ui/Loading';


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
      const validationResult = await validateSignUpAsync(data as SignUpFormData);
      
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

  return (
    <div className="card card-large">
      <h3 className="title-large center">
        {getToggleLabels(LOGIN_SIGNUP_LABELS, isLogin).primaryLabel} mit Email
      </h3>
      
      <form onSubmit={currentForm.handleSubmit} className="form">
        {!isLogin && (
          <>
            <Input
              {...signupForm.getFieldProps('fullName')}
              type="text"
              placeholder="Vollständiger Name"
              required
              showCheckmark
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
          {...(!isLogin ? { helpText: "Mindestens 6 Zeichen, mit Groß-/Kleinbuchstaben und Zahl" } : {})}
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

        {/* Auth Help Links - nur bei Login anzeigen */}
        {isLogin && (
          <div className="auth-help-links">
            <a 
              href="/auth/forgot-password" 
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Passwort vergessen?
            </a>
            <span className="separator">|</span>
            <a 
              href="/auth/recovery" 
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              E-Mail vergessen?
            </a>
          </div>
        )}
      </form>
      
      <div className="form-toggle">
        {getToggleLabels(LOGIN_SIGNUP_LABELS, isLogin).promptLabel}{' '}
        <button
          onClick={formToggle.toggle}
          className="link-button"
          type="button"
        >
          {getToggleLabels(LOGIN_SIGNUP_LABELS, isLogin).actionLabel}
        </button>
      </div>
    </div>
  );
}