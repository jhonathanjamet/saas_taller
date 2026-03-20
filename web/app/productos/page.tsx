'use client';

import { useEffect, useState } from 'react';
import { apiRequest } from '../../lib/api';
import { Sidebar } from '../../components/Sidebar';

type Product = {
  id: string;
  name: string;
  sku?: string | null;
  price?: number | null;
};

type Branch = { id: string; name: string };

type Inventory = {
  id: string;
  productId: string;
  branchId: string;
  quantity: number;
  reservedQuantity: number;
};

export default function ProductosPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [productName, setProductName] = useState('');
  const [productSku, setProductSku] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [invProductId, setInvProductId] = useState('');
  const [invBranchId, setInvBranchId] = useState('');
  const [invDelta, setInvDelta] = useState('');
  const [error, setError] = useState('');

  const token =
    typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

  useEffect(() => {
    if (!token) {
      window.location.href = '/login';
      return;
    }
    apiRequest<Product[]>('/products', {
      headers: { Authorization: `Bearer ${token}` },
    }).then(setProducts);
    apiRequest<Inventory[]>('/inventory', {
      headers: { Authorization: `Bearer ${token}` },
    }).then(setInventory);
    apiRequest<Branch[]>('/branches', {
      headers: { Authorization: `Bearer ${token}` },
    }).then((list) => {
      setBranches(list);
      if (!invBranchId && list.length > 0) setInvBranchId(list[0].id);
    });
  }, [token]);

  async function createProduct(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!token) return;
    try {
      const created = await apiRequest<Product>('/products', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: productName,
          ...(productSku ? { sku: productSku } : {}),
          ...(productPrice ? { price: Number(productPrice) } : {}),
        }),
      });
      setProducts((prev) => [created, ...prev]);
      setProductName('');
      setProductSku('');
      setProductPrice('');
    } catch (err: any) {
      setError(err.message || 'Error creando producto');
    }
  }

  async function adjustInventory(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!token) return;
    try {
      const created = await apiRequest<Inventory>('/inventory/adjust', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          productId: invProductId,
          branchId: invBranchId,
          quantityDelta: Number(invDelta),
          reason: 'Ajuste desde panel',
        }),
      });
      setInventory((prev) => [created, ...prev]);
      setInvProductId('');
      setInvDelta('');
    } catch (err: any) {
      setError(err.message || 'Error ajustando inventario');
    }
  }

  return (
    <main className="min-h-screen">
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1">
          <header className="border-b border-gray-200 bg-white/80 backdrop-blur">
            <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
              <h1 className="text-xl font-semibold text-ink">Productos</h1>
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
              <h2 className="text-lg font-semibold text-ink">Nuevo producto</h2>
              <form className="mt-4 space-y-3" onSubmit={createProduct}>
                <input
                  className="w-full rounded-md border border-gray-200 px-3 py-2"
                  placeholder="Nombre"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  required
                />
                <input
                  className="w-full rounded-md border border-gray-200 px-3 py-2"
                  placeholder="SKU"
                  value={productSku}
                  onChange={(e) => setProductSku(e.target.value)}
                />
                <input
                  className="w-full rounded-md border border-gray-200 px-3 py-2"
                  placeholder="Precio"
                  value={productPrice}
                  onChange={(e) => setProductPrice(e.target.value)}
                  type="number"
                  min="0"
                  step="0.01"
                />
                <button className="w-full rounded-md bg-brand py-2 text-white font-medium">
                  Crear producto
                </button>
              </form>

              <h3 className="mt-8 text-sm font-semibold text-gray-600">Ajuste de inventario</h3>
              <form className="mt-3 space-y-3" onSubmit={adjustInventory}>
                <select
                  className="w-full rounded-md border border-gray-200 px-3 py-2"
                  value={invProductId}
                  onChange={(e) => setInvProductId(e.target.value)}
                  required
                >
                  <option value="">Producto</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <select
                  className="w-full rounded-md border border-gray-200 px-3 py-2"
                  value={invBranchId}
                  onChange={(e) => setInvBranchId(e.target.value)}
                  required
                >
                  <option value="">Sucursal</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
                <input
                  className="w-full rounded-md border border-gray-200 px-3 py-2"
                  placeholder="Cantidad (puede ser negativa)"
                  value={invDelta}
                  onChange={(e) => setInvDelta(e.target.value)}
                  type="number"
                  step="1"
                  required
                />
                <button className="w-full rounded-md bg-accent py-2 text-white font-medium">
                  Ajustar stock
                </button>
              </form>
              {error ? (
                <div className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </div>
              ) : null}
            </section>

            <section className="lg:col-span-2 rounded-2xl bg-white p-6 shadow">
              <h2 className="text-lg font-semibold text-ink">Inventario</h2>
              <div className="mt-4 overflow-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500">
                      <th className="py-2">Producto</th>
                      <th className="py-2">Sucursal</th>
                      <th className="py-2">Stock</th>
                      <th className="py-2">Reservado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventory.map((i) => {
                      const product = products.find((p) => p.id === i.productId);
                      const branch = branches.find((b) => b.id === i.branchId);
                      return (
                        <tr key={i.id} className="border-t border-gray-100">
                          <td className="py-2">{product?.name || i.productId}</td>
                          <td className="py-2">{branch?.name || i.branchId}</td>
                          <td className="py-2">{i.quantity}</td>
                          <td className="py-2">{i.reservedQuantity}</td>
                        </tr>
                      );
                    })}
                    {inventory.length === 0 ? (
                      <tr>
                        <td className="py-4 text-gray-500" colSpan={4}>
                          No hay inventario aún.
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
