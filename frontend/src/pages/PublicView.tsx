import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { StatsCounter } from '../components/StatsCounter';
import { ApplicationsTable } from '../components/ApplicationsTable';
import { InterviewCalendar } from '../components/InterviewCalendar';
import { ApiError, api } from '../lib/api';
import type { PublicDashboard } from '../types';

export function PublicView() {
  const { shareToken } = useParams<{ shareToken: string }>();
  const [data, setData] = useState<PublicDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    setError(null);
    setData(null);

    if (!shareToken) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    api.getPublicDashboard(shareToken)
      .then(setData)
      .catch((err: unknown) => {
        if (err instanceof ApiError && err.status === 404) {
          setNotFound(true);
          return;
        }
        setError(err instanceof Error ? err.message : 'Failed to load dashboard');
      })
      .finally(() => setLoading(false));
  }, [shareToken]);

  return (
    <Layout>
      <div className="page-wrapper">
        {loading && <div className="loading-state">Loading…</div>}

        {!loading && notFound && (
          <div className="not-found">
            <h2 className="not-found-title">Dashboard Not Found</h2>
            <p className="not-found-desc">
              This public dashboard doesn't exist or is no longer shared.
            </p>
          </div>
        )}

        {!loading && !notFound && error && (
          <div className="alert alert--error">{error}</div>
        )}

        {!loading && !notFound && data && (
          <>
            <div className="dashboard-header">
              <h1 className="page-title">
                {data.displayName ? `${data.displayName}'s Job Search` : 'Job Search Dashboard'}
              </h1>
              <span className="public-badge">Public View</span>
            </div>

            <StatsCounter applications={data.applications} />

            <div className="dashboard-grid">
              <div className="dashboard-main">
                <div className="section-header">
                  <h2 className="section-title">Applications</h2>
                  <span className="section-count">{data.applications.length} total</span>
                </div>
                <ApplicationsTable applications={data.applications} />
              </div>

              <div className="dashboard-sidebar">
                <InterviewCalendar interviews={data.interviews} />
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
