import { useState, useEffect } from 'react';
import type { Application, ApplicationStatus } from '../types';
import { StatusBadge } from './StatusBadge';

interface Props {
  applications: Application[];
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

const STATUS_ORDER: ApplicationStatus[] = ['waiting', 'interviewing', 'applied', 'offer', 'rejected'];

function sortApplications(apps: Application[]): Application[] {
  return [...apps].sort((a, b) => {
    const ao = STATUS_ORDER.indexOf(a.status);
    const bo = STATUS_ORDER.indexOf(b.status);
    if (ao !== bo) return ao - bo;
    return b.dateApplied.localeCompare(a.dateApplied);
  });
}

function usePageSize(): number {
  const [size, setSize] = useState(window.innerWidth < 768 ? 5 : 8);
  useEffect(() => {
    const handler = () => setSize(window.innerWidth < 768 ? 5 : 8);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return size;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[parseInt(month, 10) - 1]} ${parseInt(day, 10)}, ${year}`;
}

export function ApplicationsTable({ applications, onEdit, onDelete }: Props) {
  const [page, setPage] = useState(0);
  const pageSize = usePageSize();

  const sorted = sortApplications(applications);
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const currentPage = Math.min(page, totalPages - 1);
  const visible = sorted.slice(currentPage * pageSize, (currentPage + 1) * pageSize);

  const showActions = !!(onEdit || onDelete);

  return (
    <div className="table-section">
      {applications.length === 0 ? (
        <div className="table-empty">
          <p>No applications yet. Add your first one!</p>
        </div>
      ) : (
        <>
          <div className="table-wrapper">
            <table className="apps-table">
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Method</th>
                  <th>Applied</th>
                  {showActions && <th className="actions-col">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {visible.map(app => (
                  <tr key={app.id}>
                    <td className="td-company">{app.company}</td>
                    <td className="td-title">
                      {app.link ? (
                        <a href={app.link} target="_blank" rel="noreferrer" className="company-link">
                          {app.title}
                        </a>
                      ) : (
                        app.title
                      )}
                    </td>
                    <td><StatusBadge status={app.status} /></td>
                    <td className="td-method">{app.method}</td>
                    <td className="td-date">{formatDate(app.dateApplied)}</td>
                    {showActions && (
                      <td className="td-actions">
                        {onEdit && (
                          <button className="action-btn action-btn--edit" onClick={() => onEdit(app.id)} title="Edit">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                          </button>
                        )}
                        {onDelete && (
                          <button className="action-btn action-btn--delete" onClick={() => onDelete(app.id)} title="Delete">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6"/>
                              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                              <path d="M10 11v6M14 11v6"/>
                              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                            </svg>
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="page-btn"
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={currentPage === 0}
              >
                ← Prev
              </button>
              <span className="page-info">
                {currentPage + 1} / {totalPages}
              </span>
              <button
                className="page-btn"
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={currentPage === totalPages - 1}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
