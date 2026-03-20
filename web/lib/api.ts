export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    if (res.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
      const method = (options.method || 'GET').toUpperCase();
      if (method === 'GET') {
        return [] as T;
      }
    }
    throw new Error(body.message || 'Error en la API');
  }

  return res.json();
}
