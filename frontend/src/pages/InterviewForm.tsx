import { useState, useEffect, type FormEvent } from 'react';
import { api } from '../lib/api';

function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

const INTERVIEW_TYPES = [
  'Recruiter Call', 'Phone Screen', 'Tech Screen', '2nd Tech Screen',
  'Hiring Manager', 'System Design', 'Take-Home Project', 'Onsite', 'Panel', 'Final Round', 'Other',
];

interface Props {
  editId?: string;
  onClose: () => void;
  onSaved: () => void;
}

export function InterviewForm({ editId, onClose, onSaved }: Props) {
  const isEdit = !!editId;

  const [company,   setCompany]   = useState('');
  const [title,     setTitle]     = useState('');
  const [type,      setType]      = useState('Recruiter Call');
  const [date,      setDate]      = useState(todayISO());
  const [time,      setTime]      = useState('');
  const [isTbd,     setIsTbd]     = useState(false);
  const [tentative, setTentative] = useState(false);

  const [loading, setLoading] = useState(isEdit);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    if (!isEdit || !editId) return;
    api.getInterviews()
      .then(ivs => {
        const iv = ivs.find(i => i.id === editId);
        if (!iv) { setError('Interview not found'); return; }
        setCompany(iv.company);
        setTitle(iv.title ?? '');
        setType(iv.type);
        setDate(iv.date);
        setIsTbd(iv.time === 'TBD');
        setTime(iv.time === 'TBD' ? '' : iv.time);
        setTentative(iv.tentative);
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
        company: company.trim(),
        title:   title.trim() || undefined,
        type,
        date,
        time:    isTbd ? 'TBD' : time,
        tentative,
      };
      if (isEdit && editId) {
        await api.updateInterview(editId, data);
      } else {
        await api.createInterview(data);
      }
      onSaved();
    } catch (err) {
      setError((err as Error).message || 'Failed to save interview');
      setSaving(false);
    }
  };

  if (loading) return <div className="loading-state">Loading…</div>;

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="alert alert--error">{error}</div>}

      <div className="form-row">
        <div className="form-group">
          <label className="form-label" htmlFor="iv-company">Company *</label>
          <input id="iv-company" type="text" className="form-input" value={company}
            onChange={e => setCompany(e.target.value)} placeholder="Acme Corp" required />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="iv-title">Job Title</label>
          <input id="iv-title" type="text" className="form-input" value={title}
            onChange={e => setTitle(e.target.value)} placeholder="Optional" />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label" htmlFor="iv-type">Interview Type</label>
          <select id="iv-type" className="form-select" value={type}
            onChange={e => setType(e.target.value)}>
            {INTERVIEW_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="iv-date">Date</label>
          <input id="iv-date" type="date" className="form-input" value={date}
            onChange={e => setDate(e.target.value)} required />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label" htmlFor="iv-time">Time</label>
          {isTbd ? (
            <input id="iv-time" type="text" className="form-input" value="TBD" disabled />
          ) : (
            <input id="iv-time" type="time" className="form-input" value={time}
              onChange={e => setTime(e.target.value)} required />
          )}
          <label className="checkbox-label" style={{ marginTop: '0.4rem' }}>
            <input type="checkbox" className="checkbox-input" checked={isTbd}
              onChange={e => setIsTbd(e.target.checked)} />
            <span className="checkbox-text">Time TBD</span>
          </label>
        </div>
        <div className="form-group form-group--middle">
          <label className="checkbox-label">
            <input type="checkbox" className="checkbox-input" checked={tentative}
              onChange={e => setTentative(e.target.checked)} />
            <span className="checkbox-text">Mark as tentative</span>
          </label>
          <p className="form-hint">Tentative interviews show in amber on the calendar</p>
        </div>
      </div>

      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Interview'}
        </button>
      </div>
    </form>
  );
}
