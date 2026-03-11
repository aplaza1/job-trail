import { useState } from 'react';
import { Spinner } from '../components/Spinner';
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
import type { Application } from '../types';

type AppModal  = { open: true; editId?: string } | { open: false };
type IvModal   = { open: true; editId?: string } | { open: false };
type JobIvModal = { open: true; app: Application } | { open: false };
type AddIvFromJobModal = { open: true; app: Application } | { open: false };

export function Dashboard() {
  const { applications, loading: appsLoading, error: appsError, refetch: refetchApps } = useApplications();
  const { interviews,   loading: ivsLoading,  error: ivsError,  refetch: refetchIvs  } = useInterviews();

  const [appModal, setAppModal] = useState<AppModal>({ open: false });
  const [ivModal,  setIvModal]  = useState<IvModal>({ open: false });
  const [jobIvModal, setJobIvModal] = useState<JobIvModal>({ open: false });
  const [addIvFromJob, setAddIvFromJob] = useState<AddIvFromJobModal>({ open: false });

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
          <Spinner />
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
                  onViewInterviews={app => setJobIvModal({ open: true, app })}
                  onAddInterview={app => setAddIvFromJob({ open: true, app })}
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

      {jobIvModal.open && (
        <Modal
          title={`Interviews — ${jobIvModal.app.company}`}
          onClose={() => setJobIvModal({ open: false })}
        >
          {(() => {
            const linked = interviews.filter(iv => iv.applicationId === jobIvModal.app.id);
            if (linked.length === 0) {
              return <p style={{ color: 'var(--text-secondary, #6b7280)' }}>No interviews linked to this application yet.</p>;
            }
            return (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {linked.map(iv => (
                  <li key={iv.id} style={{ padding: '0.75rem', background: 'var(--surface-alt, #f9fafb)', borderRadius: '0.5rem' }}>
                    <div style={{ fontWeight: 600 }}>{iv.type}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary, #6b7280)' }}>
                      {iv.date} · {iv.time}{iv.tentative ? ' · tentative' : ''}
                    </div>
                  </li>
                ))}
              </ul>
            );
          })()}
          <div className="form-actions" style={{ marginTop: '1.5rem' }}>
            <button className="btn btn-secondary" onClick={() => setJobIvModal({ open: false })}>Close</button>
            <button className="btn btn-primary" onClick={() => {
              setJobIvModal({ open: false });
              setAddIvFromJob({ open: true, app: jobIvModal.app });
            }}>Add Interview</button>
          </div>
        </Modal>
      )}

      {addIvFromJob.open && (
        <Modal
          title={`Add Interview — ${addIvFromJob.app.company}`}
          onClose={() => setAddIvFromJob({ open: false })}
        >
          <InterviewForm
            applicationId={addIvFromJob.app.id}
            prefillCompany={addIvFromJob.app.company}
            prefillTitle={addIvFromJob.app.title}
            onClose={() => setAddIvFromJob({ open: false })}
            onSaved={() => { setAddIvFromJob({ open: false }); refetchIvs(); }}
          />
        </Modal>
      )}
    </Layout>
  );
}
