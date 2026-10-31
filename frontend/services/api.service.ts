import axios from 'axios';

export const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
).replace(/\/$/, '');
const api = axios.create({
  baseURL: API_URL,
  timeout: 60000,
});

export function imageUrl(path: string): string {
  return /^\/images\/[0-9a-f-]+$/i.test(path) ? `${API_URL}${path}` : '';
}

export async function request<T>(
  path: string,
  options: {
    token?: string | null;
    method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
    body?: unknown;
    signal?: AbortSignal;
    onProgress?: (percent: number) => void;
  } = {},
): Promise<T> {
  return (
    await api.request<T>({
      url: path,
      method: options.method || 'GET',
      data: options.body,
      signal: options.signal,
      headers: options.token
        ? { Authorization: `Bearer ${options.token}` }
        : undefined,
      onUploadProgress: options.onProgress
        ? (event) => {
            if (event.total)
              options.onProgress!(
                Math.round((event.loaded / event.total) * 100),
              );
          }
        : undefined,
    })
  ).data;
}

export interface Task {
  id: number;
  title: string;
  isCompleted: boolean;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface Account {
  id: string;
  email: string;
  full_name: string;
  student_number: string;
}

export async function register(fields: {
  full_name: string;
  student_number: string;
  email: string;
  password: string;
}): Promise<Account> {
  return (await api.post<Account>('/auth/register', fields)).data;
}

export function isUnauthorized(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 401;
}

export function responseStatus(error: unknown): number | undefined {
  return axios.isAxiosError(error) ? error.response?.status : undefined;
}

export async function fetchTasks(): Promise<Task[]> {
  return (await api.get<Task[]>('/tasks')).data;
}

export async function login(
  email: string,
  password: string,
): Promise<LoginResponse> {
  return (await api.post<LoginResponse>('/auth/login', { email, password }))
    .data;
}

export async function getAccount(token: string): Promise<Account> {
  return (
    await api.get<Account>('/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
  ).data;
}

export async function logout(token: string): Promise<void> {
  await api.post('/auth/logout', undefined, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function apiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 429)
      return 'Too many requests. Wait a minute before trying again.';
    if (error.response && error.response.status >= 500)
      return 'The server is unavailable. Please try again later.';
    const message: unknown = error.response?.data?.message;
    if (typeof message === 'string') return message;
    if (Array.isArray(message)) return message.join(', ');
    if (!error.response)
      return 'Cannot connect to the backend. Check that it is running.';
  }
  return error instanceof Error && !axios.isAxiosError(error)
    ? error.message
    : 'The request failed. Please try again.';
}
