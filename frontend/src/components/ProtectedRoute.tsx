import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { getCurrentUser } from '../lib/auth';
import { Spinner } from './Spinner';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<'loading' | 'auth' | 'unauth'>('loading');

  useEffect(() => {
    getCurrentUser()
      .then(() => setStatus('auth'))
      .catch(() => setStatus('unauth'));
  }, []);

  if (status === 'loading') return <Spinner />;
  if (status === 'unauth') return <Navigate to="/login" replace />;
  return <>{children}</>;
}
