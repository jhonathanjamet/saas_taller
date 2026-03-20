'use client';

import { useEffect, useState } from 'react';
import { apiRequest } from '../../lib/api';
import { Sidebar } from '../../components/Sidebar';

type Customer = { id: string; firstName: string; lastName?: string | null };
type Branch = { id: string; name: string };
type Quote = { id: string; quoteNumber: string; customerId: string; status?: string | null };

export default function CotizacionesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [quoteNumber, setQuoteNumber] = useState('');
  const [quoteBranchId, setQuoteBranchId] = useState('');
  const [quoteCustomerId, setQuoteCustomerId] = useState('');
  const [error, setError] = useState('');

  const token =
    typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

  useEffect(() => {
    if (!token) {
      window.location.href = '/login';
      return;
    }
    apiRequest<Quote[]>('/quotes', {
      headers: { Authorization: `Bearer ${token}` },
    }).then(setQuotes);
    apiRequest<Customer[]>('/customers', {
      headers: { Authorization: `Bearer ${token}` },
    }).then(setCustomers);
    apiRequest<Branch[]>('/branches', {
      headers: { Authorization: `Bearer ${token}` },
    }).then((list) => {
      setBranches(list);
      if (!quoteBranchId && list.length > 0) setQuoteBranchId(list[0].id);
    });
  }, [token]);

  async function createQuote(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!token) return;
    try {
      const created = await apiRequest<Quote>('/quotes', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          quoteNumber,
          branchId: quoteBranchId,
          customerId: quoteCustomerId,
        }),
      });
      setQuotes((prev) => [created, ...prev]);
      setQuoteNumber('');
      setQuoteCustomerId('');
    } catch (err: any) {
      setError(err.message || 'Error creando cotización');
    }
  }

  return (
    <main className="min-h-screen">
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1">
          <header className="border-b border-gray-200 bg-white/80 backdrop-blur">
            <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
              <h1 className="text-xl font-semibold text-ink">Cotizaciones</h1>
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
              <h2 className="text-lg font-semibold text-ink">Nueva cotización</h2>
              <form className="mt-4 space-y-3" onSubmit={createQuote}>
                <input
                  className="w-full rounded-md border border-gray-200 px-3 py-2"
                  placeholder="Número (COT-0001)"
                  value={quoteNumber}
                  onChange={(e) => setQuoteNumber(e.target.value)}
                  required
                />
                <select
                  className="w-full rounded-md border border-gray-200 px-3 py-2"
                  value={quoteBranchId}
                  onChange={(e) => setQuoteBranchId(e.target.value)}
                  required
                >
                  <option value="">Sucursal</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
                <select
                  className="w-full rounded-md border border-gray-200 px-3 py-2"
                  value={quoteCustomerId}
                  onChange={(e) => setQuoteCustomerId(e.target.value)}
                  required
                >
                  <option value="">Cliente</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.firstName} {c.lastName || ''}
                    </option>
                  ))}
                </select>
                <button className="w-full rounded-md bg-brand py-2 text-white font-medium">
                  Crear cotización
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
                      <th className="py-2">Número</th>
                      <th className="py-2">Cliente</th>
                      <th className="py-2">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quotes.map((q) => {
                      const customer = customers.find((c) => c.id === q.customerId);
                      return (
                        <tr key={q.id} className="border-t border-gray-100">
                          <td className="py-2">{q.quoteNumber}</td>
                          <td className="py-2">
                            {customer ? `${customer.firstName} ${customer.lastName || ''}` : q.customerId}
                          </td>
                          <td className="py-2">{q.status || '-'}</td>
                        </tr>
                      );
                    })}
                    {quotes.length === 0 ? (
                      <tr>
                        <td className="py-4 text-gray-500" colSpan={3}>
                          No hay cotizaciones aún.
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
