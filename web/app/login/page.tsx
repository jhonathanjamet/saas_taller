'use client';

import { useState } from 'react';
import { apiRequest } from '../../lib/api';

type LoginResponse = {
  accessToken: string;
  refreshToken: string;
};

export default function LoginPage() {
  const [email, setEmail] = useState('admin@demotaller.cl');
  const [password, setPassword] = useState('Admin123!');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await apiRequest<LoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      localStorage.setItem('accessToken', data.accessToken);
      window.location.href = '/';
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-sand px-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl p-8">
        <h1 className="text-2xl font-semibold text-ink">Ingresar a TallerHub</h1>
        <p className="mt-2 text-sm text-gray-500">Panel administrativo</p>

        <form className="mt-6 space-y-4" onSubmit={handleLogin}>
          <div>
            <label className="text-sm font-medium">Email</label>
            <input
              className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Contraseña</label>
            <input
              className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
            />
          </div>

          {error ? (
            <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
          ) : null}

          <button
            disabled={loading}
            className="w-full rounded-md bg-brand text-white py-2 font-medium hover:bg-teal-700 disabled:opacity-60"
            type="submit"
          >
            {loading ? 'Ingresando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </main>
  );
}
