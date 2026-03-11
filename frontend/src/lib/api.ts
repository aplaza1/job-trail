import { getIdToken } from './auth';
import type { Application, Interview, Profile, PublicDashboard } from '../types';

const BASE_URL = import.meta.env.VITE_API_URL || '';

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function toApiError(res: Response): Promise<ApiError> {
  const err = await res.json().catch(() => ({ message: res.statusText }));
  const message = (err as { message?: string }).message || 'Request failed';
  return new ApiError(res.status, message);
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  options?: { requiresAuth?: boolean }
): Promise<T> {
  const requiresAuth = options?.requiresAuth ?? true;
  const token = requiresAuth ? await getIdToken() : null;
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    throw await toApiError(res);
  }
  if (res.status === 204) return undefined as T;
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
  getPublicDashboard: (shareToken: string) =>
    request<PublicDashboard>('GET', `/public/${shareToken}`, undefined, { requiresAuth: false }),
};
