import { useState, useEffect } from 'react';
import { getCurrentUser, signOut } from '../lib/auth';

export function useAuth() {
  const [user, setUser] = useState<{ username: string; userId: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCurrentUser()
      .then(u => setUser({ username: u.username, userId: u.userId }))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const logout = async () => {
    await signOut();
    setUser(null);
  };

  return { user, loading, logout };
}
