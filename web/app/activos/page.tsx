'use client';

import { useEffect, useState } from 'react';
import { apiRequest } from '../../lib/api';
import { Sidebar } from '../../components/Sidebar';

type Customer = {
  id: string;
  firstName: string;
  lastName?: string | null;
};

type Asset = {
  id: string;
  customerId: string;
  brand?: string | null;
  model?: string | null;
  serialNumber?: string | null;
  licensePlate?: string | null;
};

export default function ActivosPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [assetCustomerId, setAssetCustomerId] = useState('');
  const [assetBrand, setAssetBrand] = useState('');
  const [assetModel, setAssetModel] = useState('');
  const [assetSerial, setAssetSerial] = useState('');
  const [assetPlate, setAssetPlate] = useState('');
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

    apiRequest<Asset[]>('/assets', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(setAssets)
      .catch((err) => setError(err.message || 'Error cargando activos'));
  }, [token]);

  async function createAsset(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!token) return;
    try {
      const created = await apiRequest<Asset>('/assets', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          customerId: assetCustomerId,
          brand: assetBrand,
          model: assetModel,
          serialNumber: assetSerial,
          licensePlate: assetPlate,
        }),
      });
      setAssets((prev) => [created, ...prev]);
      setAssetCustomerId('');
      setAssetBrand('');
      setAssetModel('');
      setAssetSerial('');
      setAssetPlate('');
    } catch (err: any) {
      setError(err.message || 'Error creando activo');
    }
  }

  return (
    <main className="min-h-screen">
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1">
          <header className="border-b border-gray-200 bg-white/80 backdrop-blur">
            <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
              <h1 className="text-xl font-semibold text-ink">Activos</h1>
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
              <h2 className="text-lg font-semibold text-ink">Nuevo activo</h2>
              <form className="mt-4 space-y-3" onSubmit={createAsset}>
                <select
                  className="w-full rounded-md border border-gray-200 px-3 py-2"
                  value={assetCustomerId}
                  onChange={(e) => setAssetCustomerId(e.target.value)}
                  required
                >
                  <option value="">Selecciona cliente</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.firstName} {c.lastName || ''}
                    </option>
                  ))}
                </select>
                <input
                  className="w-full rounded-md border border-gray-200 px-3 py-2"
                  placeholder="Marca"
                  value={assetBrand}
                  onChange={(e) => setAssetBrand(e.target.value)}
                />
                <input
                  className="w-full rounded-md border border-gray-200 px-3 py-2"
                  placeholder="Modelo"
                  value={assetModel}
                  onChange={(e) => setAssetModel(e.target.value)}
                />
                <input
                  className="w-full rounded-md border border-gray-200 px-3 py-2"
                  placeholder="N° de serie"
                  value={assetSerial}
                  onChange={(e) => setAssetSerial(e.target.value)}
                />
                <input
                  className="w-full rounded-md border border-gray-200 px-3 py-2"
                  placeholder="Patente"
                  value={assetPlate}
                  onChange={(e) => setAssetPlate(e.target.value)}
                />
                <button className="w-full rounded-md bg-brand py-2 text-white font-medium">
                  Crear activo
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
                      <th className="py-2">Cliente</th>
                      <th className="py-2">Marca/Modelo</th>
                      <th className="py-2">Serie</th>
                      <th className="py-2">Patente</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assets.map((a) => {
                      const customer = customers.find((c) => c.id === a.customerId);
                      return (
                        <tr key={a.id} className="border-t border-gray-100">
                          <td className="py-2">
                            {customer ? `${customer.firstName} ${customer.lastName || ''}` : a.customerId}
                          </td>
                          <td className="py-2">
                            {[a.brand, a.model].filter(Boolean).join(' ')}
                          </td>
                          <td className="py-2">{a.serialNumber || '-'}</td>
                          <td className="py-2">{a.licensePlate || '-'}</td>
                        </tr>
                      );
                    })}
                    {assets.length === 0 ? (
                      <tr>
                        <td className="py-4 text-gray-500" colSpan={4}>
                          No hay activos aún.
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
