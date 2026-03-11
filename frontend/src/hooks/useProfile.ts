import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';
import type { Profile } from '../types';

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getProfile();
      setProfile(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const updateProfile = async (data: Partial<Profile>) => {
    try {
      const updated = await api.updateProfile(data);
      setProfile(updated);
      return updated;
    } catch (e) {
      throw new Error((e as Error).message);
    }
  };

  const deleteProfile = async () => {
    try {
      await api.deleteProfile();
      setProfile(null);
    } catch (e) {
      throw new Error((e as Error).message);
    }
  };

  return { profile, loading, error, refetch: fetchData, updateProfile, deleteProfile };
}
