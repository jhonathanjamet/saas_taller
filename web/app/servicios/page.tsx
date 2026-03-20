'use client';

import { useEffect, useState } from 'react';
import { apiRequest } from '../../lib/api';
import { Sidebar } from '../../components/Sidebar';

type Service = {
  id: string;
  name: string;
  price?: number | null;
  cost?: number | null;
};

export default function ServiciosPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [cost, setCost] = useState('');
  const [error, setError] = useState('');

  const token =
    typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

  useEffect(() => {
    if (!token) {
      window.location.href = '/login';
      return;
    }
    apiRequest<Service[]>('/services', {
      headers: { Authorization: `Bearer ${token}` },
    }).then(setServices);
  }, [token]);

  async function createService(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!token) return;
    try {
      const created = await apiRequest<Service>('/services', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name,
          ...(price ? { price: Number(price) } : {}),
          ...(cost ? { cost: Number(cost) } : {}),
        }),
      });
      setServices((prev) => [created, ...prev]);
      setName('');
      setPrice('');
      setCost('');
    } catch (err: any) {
      setError(err.message || 'Error creando servicio');
    }
  }

  return (
    <main className="min-h-screen">
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1">
          <header className="border-b border-gray-200 bg-white/80 backdrop-blur">
            <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
              <h1 className="text-xl font-semibold text-ink">Servicios</h1>
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
          <div className="mx-auto max-w-6xl px-6 py-8 grid gap-6 lg:grid-cols-3">
            <section className="lg:col-span-1 rounded-2xl bg-white p-6 shadow">
              <h2 className="text-lg font-semibold text-ink">Nuevo servicio</h2>
              <form className="mt-4 space-y-3" onSubmit={createService}>
                <input
                  className="w-full rounded-md border border-gray-200 px-3 py-2"
                  placeholder="Nombre"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
                <input
                  className="w-full rounded-md border border-gray-200 px-3 py-2"
                  placeholder="Precio"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  type="number"
                />
                <input
                  className="w-full rounded-md border border-gray-200 px-3 py-2"
                  placeholder="Costo interno"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  type="number"
                />
                <button className="w-full rounded-md bg-brand py-2 text-white font-medium">
                  Crear servicio
                </button>
              </form>
              {error ? (
                <div className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </div>
              ) : null}
            </section>

            <section className="lg:col-span-2 rounded-2xl bg-white p-6 shadow">
              <h2 className="text-lg font-semibold text-ink">Listado</h2>
              <div className="mt-4 overflow-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500">
                      <th className="py-2">Nombre</th>
                      <th className="py-2">Precio</th>
                      <th className="py-2">Costo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {services.map((s) => (
                      <tr key={s.id} className="border-t border-gray-100">
                        <td className="py-2">{s.name}</td>
                        <td className="py-2">{s.price ?? '-'}</td>
                        <td className="py-2">{s.cost ?? '-'}</td>
                      </tr>
                    ))}
                    {services.length === 0 ? (
                      <tr>
                        <td className="py-4 text-gray-500" colSpan={3}>
                          No hay servicios aún.
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
