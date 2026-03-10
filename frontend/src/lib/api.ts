import { getIdToken } from './auth';
import type { Application, Interview, Profile, PublicDashboard } from '../types';

const BASE_URL = import.meta.env.VITE_API_URL || '';

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const token = await getIdToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error((err as { message?: string }).message || 'Request failed');
  }
  return res.json();
}

export const api = {
  // Applications
  getApplications: () => request<Application[]>('GET', '/applications'),
  createApplication: (data: Omit<Application, 'id' | 'userId' | 'lastUpdated'>) =>
    request<Application>('POST', '/applications', data),
  updateApplication: (id: string, data: Partial<Application>) =>
    request<Application>('PUT', `/applications/${id}`, data),
  deleteApplication: (id: string) => request<void>('DELETE', `/applications/${id}`),

  // Interviews
  getInterviews: () => request<Interview[]>('GET', '/interviews'),
  createInterview: (data: Omit<Interview, 'id' | 'userId'>) =>
    request<Interview>('POST', '/interviews', data),
  updateInterview: (id: string, data: Partial<Interview>) =>
    request<Interview>('PUT', `/interviews/${id}`, data),
  deleteInterview: (id: string) => request<void>('DELETE', `/interviews/${id}`),

  // Profile
  getProfile: () => request<Profile>('GET', '/profile'),
  updateProfile: (data: Partial<Profile>) => request<Profile>('PUT', '/profile', data),

  // Public
  getPublicDashboard: (shareToken: string): Promise<PublicDashboard> =>
    fetch(`${BASE_URL}/public/${shareToken}`).then(r => r.json()),
};
