const BASE_URL = '/api';

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export function getStoredToken(): string | null {
  return localStorage.getItem('sstg_token');
}

export function setStoredToken(token: string | null): void {
  if (token) {
    localStorage.setItem('sstg_token', token);
  } else {
    localStorage.removeItem('sstg_token');
  }
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  const contentType = response.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');

  if (!response.ok) {
    let errorMessage = 'An unexpected error occurred';
    let data;

    if (isJson) {
      data = await response.json();
      errorMessage = data.error || data.message || errorMessage;
    } else {
      errorMessage = await response.text();
    }

    throw new ApiError(errorMessage, response.status, data);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return (isJson ? await response.json() : await response.text()) as T;
}
