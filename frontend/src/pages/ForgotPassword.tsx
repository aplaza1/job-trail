import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { confirmResetPassword, resetPassword } from '../lib/auth';
import { Layout } from '../components/Layout';

type Step = 'request' | 'confirm';

export function ForgotPassword() {
  const [step, setStep] = useState<Step>('request');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRequestCode = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await resetPassword({ username: email });
      setStep('confirm');
    } catch (err) {
      setError((err as Error).message || 'Failed to request password reset code');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await confirmResetPassword({
        username: email,
        confirmationCode: code,
        newPassword,
      });
      navigate('/login');
    } catch (err) {
      setError((err as Error).message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="auth-page">
        <div className="auth-card">
          {step === 'request' ? (
            <>
              <h1 className="auth-title">Reset Password</h1>
              <p className="auth-subtitle">Enter your account email to receive a reset code.</p>

              {error && <div className="alert alert--error">{error}</div>}

              <form onSubmit={handleRequestCode} className="auth-form">
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
                <button type="submit" className="btn btn-primary btn--full" disabled={loading}>
                  {loading ? 'Sending code…' : 'Send Reset Code'}
                </button>
              </form>
            </>
          ) : (
            <>
              <h1 className="auth-title">Set New Password</h1>
              <p className="auth-subtitle">Enter the code sent to <strong>{email}</strong>.</p>

              {error && <div className="alert alert--error">{error}</div>}

              <form onSubmit={handleConfirm} className="auth-form">
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
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="newPassword">New Password</label>
                  <input
                    id="newPassword"
                    type="password"
                    className="form-input"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    minLength={8}
                    required
                    autoComplete="new-password"
                  />
                </div>
                <button type="submit" className="btn btn-primary btn--full" disabled={loading}>
                  {loading ? 'Updating password…' : 'Update Password'}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn--full"
                  onClick={() => { setStep('request'); setError(null); }}
                >
                  Back
                </button>
              </form>
            </>
          )}

          <p className="auth-footer">
            Back to{' '}
            <Link to="/login" className="auth-link">Sign In</Link>
          </p>
        </div>
      </div>
    </Layout>
  );
}
