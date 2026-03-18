import { useState, useEffect, type FormEvent } from 'react';
import { api } from '../lib/api';
import type { ApplicationStatus, ApplicationMethod } from '../types';

const STATUSES: { value: ApplicationStatus; label: string }[] = [
  { value: 'applied',      label: 'Applied' },
  { value: 'interviewing', label: 'Interviewing' },
  { value: 'waiting',      label: 'Awaiting Decision' },
  { value: 'rejected',     label: 'Rejected' },
  { value: 'offer',        label: 'Offer' },
  { value: 'declined',     label: 'Declined' },
];

const METHODS: ApplicationMethod[] = [
  'LinkedIn', 'Company Website', 'Referral', 'Indeed', 'Glassdoor', 'Recruiter', 'Other',
];

function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

interface Props {
  editId?: string;
  onClose: () => void;
  onSaved: () => void;
}

export function ApplicationForm({ editId, onClose, onSaved }: Props) {
  const isEdit = !!editId;

  const [company,     setCompany]     = useState('');
  const [title,       setTitle]       = useState('');
  const [status,      setStatus]      = useState<ApplicationStatus>('applied');
  const [method,      setMethod]      = useState<ApplicationMethod>('LinkedIn');
  const [dateApplied, setDateApplied] = useState(todayISO());
  const [link,        setLink]        = useState('');

  const [loading, setLoading] = useState(isEdit);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    if (!isEdit || !editId) return;
    api.getApplications()
      .then(apps => {
        const app = apps.find(a => a.id === editId);
        if (!app) { setError('Application not found'); return; }
        setCompany(app.company);
        setTitle(app.title);
        setStatus(app.status);
        setMethod(app.method);
        setDateApplied(app.dateApplied);
        setLink(app.link ?? '');
      })
      .catch(e => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, [editId, isEdit]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const data = {
        company:     company.trim(),
        title:       title.trim(),
        status,
        method,
        dateApplied,
        link:  link.trim()  || undefined,
      };
      if (isEdit && editId) {
        await api.updateApplication(editId, data);
      } else {
        await api.createApplication(data);
      }
      onSaved();
    } catch (err) {
      setError((err as Error).message || 'Failed to save application');
      setSaving(false);
    }
  };

  if (loading) return <div className="loading-state">Loading…</div>;

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="alert alert--error">{error}</div>}

      <div className="form-row">
        <div className="form-group">
          <label className="form-label" htmlFor="app-company">Company *</label>
          <input id="app-company" type="text" className="form-input" value={company}
            onChange={e => setCompany(e.target.value)} placeholder="Dunder Mifflin" required />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="app-title">Job Title *</label>
          <input id="app-title" type="text" className="form-input" value={title}
            onChange={e => setTitle(e.target.value)} placeholder="Assistant Regional Manager" required />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label" htmlFor="app-status">Status</label>
          <select id="app-status" className="form-select" value={status}
            onChange={e => setStatus(e.target.value as ApplicationStatus)}>
            {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="app-method">Method</label>
          <select id="app-method" className="form-select" value={method}
            onChange={e => setMethod(e.target.value as ApplicationMethod)}>
            {METHODS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label" htmlFor="app-date">Date Applied</label>
          <input id="app-date" type="date" className="form-input" value={dateApplied}
            onChange={e => setDateApplied(e.target.value)} required />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="app-link">Job Posting URL</label>
          <input id="app-link" type="url" className="form-input" value={link}
            onChange={e => setLink(e.target.value)} placeholder="https://…" />
        </div>
      </div>

      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Application'}
        </button>
      </div>
    </form>
  );
}
