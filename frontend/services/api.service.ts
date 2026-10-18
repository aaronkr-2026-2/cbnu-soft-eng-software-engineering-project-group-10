import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  timeout: 10000,
});

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

export async function fetchTasks(): Promise<Task[]> {
  return (await api.get<Task[]>('/tasks')).data;
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  return (await api.post<LoginResponse>('/auth/login', { email, password })).data;
}

export async function getAccount(token: string): Promise<Account> {
  return (await api.get<Account>('/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  })).data;
}

export async function logout(token: string): Promise<void> {
  await api.post('/auth/logout', undefined, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function apiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const message: unknown = error.response?.data?.message;
    if (typeof message === 'string') return message;
    if (Array.isArray(message)) return message.join(', ');
    if (!error.response) return 'Cannot connect to the backend. Check that it is running.';
  }
  return 'The request failed. Please try again.';
}
