import { useState, useEffect, type FormEvent } from 'react';
import { Layout } from '../components/Layout';
import { useProfile } from '../hooks/useProfile';

const BASE_URL = typeof window !== 'undefined' ? window.location.origin : '';

export function Settings() {
  const { profile, loading, error, updateProfile } = useProfile();
  const [displayName, setDisplayName] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName ?? '');
      setIsPublic(profile.isPublic);
    }
  }, [profile]);

  const shareUrl = profile?.shareToken
    ? `${BASE_URL}/dashboard/${profile.shareToken}`
    : null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaveError(null);
    setSaving(true);
    setSaved(false);
    try {
      await updateProfile({ displayName: displayName.trim() || undefined, isPublic });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setSaveError((err as Error).message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const input = document.createElement('input');
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Layout>
      <div className="page-wrapper">
        <div className="settings-page">
          <h1 className="page-title">Settings</h1>

          {loading && <div className="loading-state">Loading settings…</div>}
          {error && <div className="alert alert--error">{error}</div>}

          {!loading && profile && (
            <div className="settings-card">
              <h2 className="settings-section-title">Profile</h2>

              {saveError && <div className="alert alert--error">{saveError}</div>}
              {saved && <div className="alert alert--success">Settings saved!</div>}

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label" htmlFor="displayName">Display Name</label>
                  <input
                    id="displayName"
                    type="text"
                    className="form-input"
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    placeholder="Your name (shown on public dashboard)"
                    maxLength={80}
                  />
                  <p className="form-hint">Shown on your public dashboard page</p>
                </div>

                <div className="form-group">
                  <label className="toggle-label">
                    <input
                      type="checkbox"
                      className="toggle-input"
                      checked={isPublic}
                      onChange={e => setIsPublic(e.target.checked)}
                    />
                    <span className="toggle-track">
                      <span className="toggle-thumb" />
                    </span>
                    <span className="toggle-text">
                      {isPublic ? 'Public dashboard enabled' : 'Dashboard is private'}
                    </span>
                  </label>
                  <p className="form-hint">
                    When enabled, anyone with the link can view your job search progress.
                  </p>
                </div>

                {isPublic && shareUrl && (
                  <div className="form-group">
                    <label className="form-label">Share Link</label>
                    <div className="share-link-row">
                      <input
                        type="text"
                        className="form-input share-link-input"
                        value={shareUrl}
                        readOnly
                      />
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={handleCopy}
                      >
                        {copied ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                  </div>
                )}

                <div className="form-actions">
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? 'Saving…' : 'Save Settings'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
