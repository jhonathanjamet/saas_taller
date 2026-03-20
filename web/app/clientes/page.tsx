'use client';

import { useEffect, useState } from 'react';
import { apiRequest } from '../../lib/api';
import { Sidebar } from '../../components/Sidebar';

type Customer = {
  id: string;
  firstName: string;
  lastName?: string | null;
  legalName?: string | null;
  email?: string | null;
  phone?: string | null;
};

export default function ClientesPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');

  const token =
    typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

  useEffect(() => {
    if (!token) {
      window.location.href = '/login';
      return;
    }
    apiRequest<Customer[]>('/customers', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(setCustomers)
      .catch((err) => setError(err.message || 'Error cargando clientes'));
  }, [token]);

  async function createCustomer(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!token) return;
    try {
      const created = await apiRequest<Customer>('/customers', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          type: 'person',
          firstName,
          ...(lastName ? { lastName } : {}),
          ...(email ? { email } : {}),
          ...(phone ? { phone } : {}),
        }),
      });
      setCustomers((prev) => [created, ...prev]);
      setFirstName('');
      setLastName('');
      setEmail('');
      setPhone('');
    } catch (err: any) {
      setError(err.message || 'Error creando cliente');
    }
  }

  return (
    <main className="min-h-screen">
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1">
          <header className="border-b border-gray-200 bg-white/80 backdrop-blur">
            <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
              <h1 className="text-xl font-semibold text-ink">Clientes</h1>
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
              <h2 className="text-lg font-semibold text-ink">Nuevo cliente</h2>
              <form className="mt-4 space-y-3" onSubmit={createCustomer}>
                <input
                  className="w-full rounded-md border border-gray-200 px-3 py-2"
                  placeholder="Nombre"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
                <input
                  className="w-full rounded-md border border-gray-200 px-3 py-2"
                  placeholder="Apellido"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
                <input
                  className="w-full rounded-md border border-gray-200 px-3 py-2"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                />
                <input
                  className="w-full rounded-md border border-gray-200 px-3 py-2"
                  placeholder="Teléfono"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
                <button className="w-full rounded-md bg-brand py-2 text-white font-medium">
                  Crear cliente
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
                      <th className="py-2">Email</th>
                      <th className="py-2">Teléfono</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map((c) => {
                      const fullName = [c.firstName, c.lastName].filter(Boolean).join(' ').trim();
                      const displayName = fullName || c.legalName || '-';
                      return (
                      <tr key={c.id} className="border-t border-gray-100">
                        <td className="py-2">
                          {displayName}
                        </td>
                        <td className="py-2">{c.email || '-'}</td>
                        <td className="py-2">{c.phone || '-'}</td>
                      </tr>
                      );
                    })}
                    {customers.length === 0 ? (
                      <tr>
                        <td className="py-4 text-gray-500" colSpan={3}>
                          No hay clientes aún.
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
