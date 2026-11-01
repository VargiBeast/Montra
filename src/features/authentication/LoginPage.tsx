import { useState } from 'react';
import { useAuth } from './AuthProvider';
import { isSupabaseConfigured } from '@/lib/supabase';
import './auth.css';

export function LoginPage() {
  const { signInWithGoogle, loading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleGoogle() {
    setError(null);
    setSubmitting(true);
    const { error: authError } = await signInWithGoogle();
    setSubmitting(false);
    if (authError) setError(authError);
  }

  if (!isSupabaseConfigured) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h1>Configuration required</h1>
          <p className="auth-config-hint">
            Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to continue.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-logo">M</div>
          <h1>Montra</h1>
          <p className="auth-tagline">Track · Understand · Plan</p>
        </div>

        {error && (
          <div className="auth-error" role="alert">
            {error}
          </div>
        )}

        <button
          type="button"
          className="auth-google"
          onClick={handleGoogle}
          disabled={submitting || loading}
        >
          <GoogleIcon />
          {submitting ? 'Redirecting…' : 'Continue with Google'}
        </button>

        <p className="auth-note">
          Sign in or create an account with Google. One tap — no password.
        </p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#EA4335"
        d="M12 10.2v3.6h5.1c-.2 1.2-1.5 3.6-5.1 3.6-3.1 0-5.6-2.5-5.6-5.6S8.9 6.2 12 6.2c1.8 0 3 .7 3.7 1.4l2.5-2.4C16.7 3.7 14.6 2.7 12 2.7 6.9 2.7 2.7 6.9 2.7 12S6.9 21.3 12 21.3c5.5 0 9.1-3.9 9.1-9.3 0-.6-.1-1.1-.2-1.6H12z"
      />
      <path
        fill="#34A853"
        d="M3.9 7.3l3 2.2C7.7 7.2 9.7 6.2 12 6.2c1.8 0 3 .7 3.7 1.4l2.5-2.4C16.7 3.7 14.6 2.7 12 2.7 8.2 2.7 4.9 4.9 3.9 7.3z"
      />
      <path
        fill="#4A90E2"
        d="M12 21.3c2.5 0 4.6-.8 6.1-2.2l-2.9-2.3c-.8.6-1.9 1-3.2 1-3.1 0-5.7-2.1-6.6-4.9l-3 2.3C4.3 18.9 7.8 21.3 12 21.3z"
      />
      <path
        fill="#FBBC05"
        d="M5.4 13c-.2-.6-.3-1.2-.3-1.9s.1-1.3.3-1.9l-3-2.3C1.9 8.3 1.5 10.1 1.5 12s.4 3.7 1.2 5.1l3-2.1z"
      />
    </svg>
  );
}
