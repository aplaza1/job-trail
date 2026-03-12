import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Spinner } from '../components/Spinner';
import { api, ApiError } from '../lib/api';
import type { AdminStats } from '../types';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  applied:      { label: 'Applied',           color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe' },
  interviewing: { label: 'Interviewing',      color: '#92400e', bg: '#fffbeb', border: '#fde68a' },
  waiting:      { label: 'Awaiting Decision', color: '#5b21b6', bg: '#f5f3ff', border: '#ddd6fe' },
  rejected:     { label: 'Rejected',          color: '#991b1b', bg: '#fef2f2', border: '#fecaca' },
  offer:        { label: 'Offer',             color: '#14532d', bg: '#f0fdf4', border: '#bbf7d0' },
};

export function Admin() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getAdminStats()
      .then(setStats)
      .catch((err: unknown) => {
        if (err instanceof ApiError && err.status === 403) {
          navigate('/dashboard', { replace: true });
        } else {
          setError((err as Error).message || 'Failed to load stats');
        }
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  if (loading) {
    return (
      <Layout>
        <div className="page-wrapper"><Spinner /></div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="page-wrapper">
          <div className="alert alert--error">{error}</div>
        </div>
      </Layout>
    );
  }

  if (!stats) return null;

  return (
    <Layout>
      <div className="page-wrapper">
        <h1 className="page-title">Owner Analytics</h1>

        {/* Users */}
        <div className="settings-card" style={{ marginBottom: '1.5rem' }}>
          <h2 className="settings-section-title">Users</h2>
          <div className="counters-grid">
            <div className="counter-card">
              <div className="counter-value">{stats.users.total}</div>
              <div className="counter-label">Total Registered</div>
            </div>
            <div className="counter-card">
              <div className="counter-value">{stats.users.newThisWeek}</div>
              <div className="counter-label">New This Week</div>
            </div>
            <div className="counter-card">
              <div className="counter-value">{stats.users.newThisMonth}</div>
              <div className="counter-label">New This Month</div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="settings-card" style={{ marginBottom: '1.5rem' }}>
          <h2 className="settings-section-title">Content</h2>
          <div className="counters-grid">
            <div className="counter-card card-applied">
              <div className="counter-value">{stats.applications.total}</div>
              <div className="counter-label">Total Applications</div>
            </div>
            <div className="counter-card card-interviewing">
              <div className="counter-value">{stats.interviews.total}</div>
              <div className="counter-label">Total Interviews</div>
            </div>
          </div>
        </div>

        {/* Applications by status */}
        <div className="settings-card" style={{ marginBottom: '1.5rem' }}>
          <h2 className="settings-section-title">Applications by Status</h2>
          <div className="counters-grid">
            {Object.entries(stats.applications.byStatus).map(([status, count]) => {
              const cfg = STATUS_CONFIG[status];
              return (
                <div key={status} className="counter-card" style={cfg ? { borderColor: cfg.border } : undefined}>
                  <div className="counter-value" style={cfg ? { color: cfg.color } : undefined}>{count}</div>
                  <div className="counter-label">
                    {cfg ? (
                      <span
                        className="status-badge"
                        style={{ color: cfg.color, background: cfg.bg, borderColor: cfg.border }}
                      >
                        {cfg.label}
                      </span>
                    ) : status}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Google Analytics link */}
        <div className="settings-card">
          <h2 className="settings-section-title">Behavior Analytics</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.9rem' }}>
            Sessions, page views, active users, and geography are tracked via Google Analytics.
          </p>
          <a
            href="https://analytics.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary"
          >
            Open Google Analytics
          </a>
        </div>
      </div>
    </Layout>
  );
}
