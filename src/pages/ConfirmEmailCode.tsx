// src/pages/ConfirmEmailCode.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import Container from '../components/layout/Container';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
const EMAIL_EMOJI = '✉️';

export default function ConfirmEmailCode() {
  const [code, setCode] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess('');
    try {
      // Supabase: Confirm sign up with code
      const { error: supaError } = await supabase.auth.verifyOtp({
        type: 'signup',
        token: code.trim(),
        email: email.trim(),
      });
      if (supaError) {
        setError('Code ist ungültig oder abgelaufen.');
      } else {
        setSuccess('Bestätigung erfolgreich! Sie werden weitergeleitet...');
        setTimeout(() => navigate('/login'), 1500);
      }
    } catch {
      setError('Unbekannter Fehler. Bitte versuchen Sie es erneut.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page">
      <Container>
        <div className="page-header">
          <h1 className="page-title">{EMAIL_EMOJI} Email bestätigen</h1>
          <p className="page-description">
            Bitte geben Sie den Bestätigungscode aus Ihrer Email ein, um Ihr Konto zu aktivieren.
          </p>
        </div>
        <div className="content-center">
          <div className="card card-large">
            <form onSubmit={handleSubmit} className="form">
              <div className="input-group">
                <label htmlFor="email" className="input-label">Ihre Email-Adresse *</label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Ihre Email-Adresse"
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div className="input-group">
                <label htmlFor="code" className="input-label">Bestätigungscode *</label>
                <Input
                  id="code"
                  type="text"
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  placeholder="Code aus Ihrer Email"
                  required
                  autoFocus
                  disabled={isSubmitting}
                />
              </div>
              {error && <div className="input-error-message">{error}</div>}
              {success && <div className="input-success-message">{success}</div>}
              <div className="form-actions">
                <Button
                  type="submit"
                  variant="primary"
                  size="large"
                  disabled={!code.trim() || isSubmitting}
                  fullWidth
                >
                  {isSubmitting ? 'Bestätige...' : 'Code bestätigen'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </Container>
    </div>
  );
}
