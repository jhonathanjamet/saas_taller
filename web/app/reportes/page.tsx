'use client';

import { useEffect, useState } from 'react';
import { apiRequest } from '../../lib/api';
import { Sidebar } from '../../components/Sidebar';

type SummaryRow = {
  statusId: string;
  statusName: string;
  total: number;
};

export default function ReportesPage() {
  const [rows, setRows] = useState<SummaryRow[]>([]);
  const [error, setError] = useState('');

  const token =
    typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

  useEffect(() => {
    if (!token) {
      window.location.href = '/login';
      return;
    }
    apiRequest<SummaryRow[]>('/reports/summary', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(setRows)
      .catch((err) => setError(err.message || 'Error cargando reportes'));
  }, [token]);

  return (
    <main className="min-h-screen">
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1">
          <header className="border-b border-gray-200 bg-white/80 backdrop-blur">
            <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
              <h1 className="text-xl font-semibold text-ink">Reportes</h1>
              <button
                className="text-sm text-gray-600 hover:text-ink"
                onClick={() => {
                  localStorage.removeItem('accessToken');
                  window.location.href = '/login';
                }}
              >
                Cerrar sesión
              </button>
            </div>
          </header>
          <div className="mx-auto max-w-6xl px-6 py-8">
            <section className="rounded-2xl bg-white p-6 shadow">
              <h2 className="text-lg font-semibold text-ink">Órdenes por estado</h2>
              {error ? (
                <div className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </div>
              ) : null}
              <div className="mt-4 overflow-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500">
                      <th className="py-2">Estado</th>
                      <th className="py-2">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.statusId} className="border-t border-gray-100">
                        <td className="py-2">{r.statusName}</td>
                        <td className="py-2">{r.total}</td>
                      </tr>
                    ))}
                    {rows.length === 0 ? (
                      <tr>
                        <td className="py-4 text-gray-500" colSpan={2}>
                          No hay datos aún.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
