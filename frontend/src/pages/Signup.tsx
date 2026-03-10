import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signUp, confirmSignUp } from '../lib/auth';
import { Layout } from '../components/Layout';

type Step = 'register' | 'verify';

export function Signup() {
  const [step, setStep] = useState<Step>('register');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signUp({ username: email, password, options: { userAttributes: { email } } });
      setStep('verify');
    } catch (err) {
      setError((err as Error).message || 'Sign up failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await confirmSignUp({ username: email, confirmationCode: code });
      navigate('/login', { state: { message: 'Account created! Please sign in.' } });
    } catch (err) {
      setError((err as Error).message || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="auth-page">
        <div className="auth-card">
          {step === 'register' ? (
            <>
              <h1 className="auth-title">Create Account</h1>
              <p className="auth-subtitle">Start tracking your job search</p>

              {error && <div className="alert alert--error">{error}</div>}

              <form onSubmit={handleRegister} className="auth-form">
                <div className="form-group">
                  <label className="form-label" htmlFor="email">Email</label>
                  <input
                    id="email"
                    type="email"
                    className="form-input"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    autoComplete="email"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="password">Password</label>
                  <input
                    id="password"
                    type="password"
                    className="form-input"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    required
                    minLength={8}
                    autoComplete="new-password"
                  />
                </div>
                <button type="submit" className="btn btn-primary btn--full" disabled={loading}>
                  {loading ? 'Creating account…' : 'Create Account'}
                </button>
              </form>

              <p className="auth-footer">
                Already have an account?{' '}
                <Link to="/login" className="auth-link">Sign in</Link>
              </p>
            </>
          ) : (
            <>
              <h1 className="auth-title">Verify Email</h1>
              <p className="auth-subtitle">We sent a code to <strong>{email}</strong></p>

              {error && <div className="alert alert--error">{error}</div>}

              <form onSubmit={handleVerify} className="auth-form">
                <div className="form-group">
                  <label className="form-label" htmlFor="code">Verification Code</label>
                  <input
                    id="code"
                    type="text"
                    className="form-input form-input--code"
                    value={code}
                    onChange={e => setCode(e.target.value)}
                    placeholder="123456"
                    required
                    autoComplete="one-time-code"
                    inputMode="numeric"
                  />
                </div>
                <button type="submit" className="btn btn-primary btn--full" disabled={loading}>
                  {loading ? 'Verifying…' : 'Verify Email'}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn--full"
                  onClick={() => { setStep('register'); setError(null); }}
                >
                  Back
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
