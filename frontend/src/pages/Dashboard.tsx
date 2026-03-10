import { useState } from 'react';
import { Layout } from '../components/Layout';
import { Modal } from '../components/Modal';
import { StatsCounter } from '../components/StatsCounter';
import { ApplicationsTable } from '../components/ApplicationsTable';
import { InterviewCalendar } from '../components/InterviewCalendar';
import { ApplicationForm } from './ApplicationForm';
import { InterviewForm } from './InterviewForm';
import { useApplications } from '../hooks/useApplications';
import { useInterviews } from '../hooks/useInterviews';
import { api } from '../lib/api';

type AppModal  = { open: true; editId?: string } | { open: false };
type IvModal   = { open: true; editId?: string } | { open: false };

export function Dashboard() {
  const { applications, loading: appsLoading, error: appsError, refetch: refetchApps } = useApplications();
  const { interviews,   loading: ivsLoading,  error: ivsError,  refetch: refetchIvs  } = useInterviews();

  const [appModal, setAppModal] = useState<AppModal>({ open: false });
  const [ivModal,  setIvModal]  = useState<IvModal>({ open: false });

  const handleDeleteApplication = async (id: string) => {
    if (!window.confirm('Delete this application?')) return;
    try {
      await api.deleteApplication(id);
      refetchApps();
    } catch (err) {
      alert((err as Error).message || 'Failed to delete');
    }
  };

  const handleDeleteInterview = async (id: string) => {
    if (!window.confirm('Delete this interview?')) return;
    try {
      await api.deleteInterview(id);
      refetchIvs();
    } catch (err) {
      alert((err as Error).message || 'Failed to delete');
    }
  };

  const isLoading = appsLoading || ivsLoading;
  const hasError  = appsError || ivsError;

  return (
    <Layout>
      <div className="page-wrapper">
        <div className="dashboard-header">
          <h1 className="page-title">Dashboard</h1>
          <div className="dashboard-actions">
            <button className="btn btn-primary btn--icon" onClick={() => setAppModal({ open: true })}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Add Application
            </button>
            <button className="btn btn-secondary btn--icon" onClick={() => setIvModal({ open: true })}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Add Interview
            </button>
          </div>
        </div>

        {hasError && <div className="alert alert--error">{appsError || ivsError}</div>}

        {isLoading ? (
          <div className="loading-state">Loading your data…</div>
        ) : (
          <>
            <StatsCounter applications={applications} />

            <div className="dashboard-grid">
              <div className="dashboard-main">
                <div className="section-header">
                  <h2 className="section-title">Applications</h2>
                  <span className="section-count">{applications.length} total</span>
                </div>
                <ApplicationsTable
                  applications={applications}
                  onEdit={id => setAppModal({ open: true, editId: id })}
                  onDelete={handleDeleteApplication}
                />
              </div>

              <div className="dashboard-sidebar">
                <InterviewCalendar
                  interviews={interviews}
                  onEdit={id => setIvModal({ open: true, editId: id })}
                  onDelete={handleDeleteInterview}
                />
              </div>
            </div>
          </>
        )}
      </div>

      {appModal.open && (
        <Modal
          title={appModal.editId ? 'Edit Application' : 'Add Application'}
          onClose={() => setAppModal({ open: false })}
        >
          <ApplicationForm
            editId={appModal.editId}
            onClose={() => setAppModal({ open: false })}
            onSaved={() => { setAppModal({ open: false }); refetchApps(); }}
          />
        </Modal>
      )}

      {ivModal.open && (
        <Modal
          title={ivModal.editId ? 'Edit Interview' : 'Add Interview'}
          onClose={() => setIvModal({ open: false })}
        >
          <InterviewForm
            editId={ivModal.editId}
            onClose={() => setIvModal({ open: false })}
            onSaved={() => { setIvModal({ open: false }); refetchIvs(); }}
          />
        </Modal>
      )}
    </Layout>
  );
}
