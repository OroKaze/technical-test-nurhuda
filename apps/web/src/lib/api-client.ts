import { getStoredToken, clearAuthSession } from './auth-session';
import { ApiError } from './api-error';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

interface RequestOptions extends RequestInit {
  skipAuth?: boolean;
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { skipAuth = false, headers: customHeaders, ...restOptions } = options;
  const headers = new Headers(customHeaders);

  if (!skipAuth) {
    const token = getStoredToken();
    if (token && !headers.has('authorization')) {
      headers.set('authorization', `Bearer ${token}`);
    }
  }

  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`;

  let response: Response;
  try {
    response = await fetch(url, { headers, ...restOptions });
  } catch (error) {
    throw new ApiError(0, 'Jaringan tidak dapat terhubung. Pastikan backend aktif.', 'NETWORK_ERROR');
  }

  if (response.status === 401 && !skipAuth) {
    clearAuthSession();
  }

  if (!response.ok) {
    let errorBody: any = null;
    try {
      errorBody = await response.json();
    } catch {
      // not a json response
    }

    const message = errorBody?.message ?? `Request failed with status ${response.status}`;
    const code = errorBody?.code ?? 'HTTP_ERROR';
    const details = errorBody?.details ?? [];
    const requestId = errorBody?.requestId;

    throw new ApiError(response.status, message, code, details, requestId);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    return (await response.json()) as T;
  }

  return (await response.text()) as unknown as T;
}

export const api = {
  get<T>(path: string, options?: RequestOptions): Promise<T> {
    return request<T>(path, { ...options, method: 'GET' });
  },

  post<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    const headers = new Headers(options?.headers);
    if (body !== undefined && !headers.has('content-type')) {
      headers.set('content-type', 'application/json');
    }
    return request<T>(path, {
      ...options,
      method: 'POST',
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  },

  patch<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    const headers = new Headers(options?.headers);
    if (body !== undefined && !headers.has('content-type')) {
      headers.set('content-type', 'application/json');
    }
    return request<T>(path, {
      ...options,
      method: 'PATCH',
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  },

  delete<T>(path: string, options?: RequestOptions): Promise<T> {
    return request<T>(path, { ...options, method: 'DELETE' });
  },

  async uploadPhoto<T>(file: File): Promise<T> {
    const formData = new FormData();
    formData.append('photo', file, file.name);

    return request<T>('/api/v1/me/profile/photo', {
      method: 'POST',
      body: formData,
      // Do not set content-type header, let browser set boundary
    });
  },

  resolvePhotoUrl(photoUrl: string | null | undefined): string | null {
    if (!photoUrl) return null;
    if (photoUrl.startsWith('http')) return photoUrl;
    return `${API_BASE_URL}${photoUrl}`;
  },
};
