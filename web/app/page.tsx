'use client';

import { useEffect, useState } from 'react';
import { apiRequest } from '../lib/api';
import { Sidebar } from '../components/Sidebar';

type Customer = {
  id: string;
  firstName: string;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
};

type Asset = {
  id: string;
  customerId: string;
  brand?: string | null;
  model?: string | null;
  serialNumber?: string | null;
  licensePlate?: string | null;
};

type Branch = {
  id: string;
  name: string;
};

type WorkOrderStatus = {
  id: string;
  name: string;
};

type WorkOrder = {
  id: string;
  orderNumber: string;
  branchId: string;
  customerId: string;
  assetId?: string | null;
  statusId: string;
  priority?: string | null;
  orderType?: string | null;
};

type Quote = {
  id: string;
  quoteNumber: string;
  branchId: string;
  customerId: string;
  status?: string | null;
};

type Product = {
  id: string;
  name: string;
  sku?: string | null;
  price?: number | null;
};

type Inventory = {
  id: string;
  productId: string;
  branchId: string;
  quantity: number;
  reservedQuantity: number;
};

export default function DashboardPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [statuses, setStatuses] = useState<WorkOrderStatus[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [assetCustomerId, setAssetCustomerId] = useState('');
  const [assetBrand, setAssetBrand] = useState('');
  const [assetModel, setAssetModel] = useState('');
  const [assetSerial, setAssetSerial] = useState('');
  const [assetPlate, setAssetPlate] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [orderBranchId, setOrderBranchId] = useState('');
  const [orderCustomerId, setOrderCustomerId] = useState('');
  const [orderAssetId, setOrderAssetId] = useState('');
  const [orderStatusId, setOrderStatusId] = useState('');
  const [orderPriority, setOrderPriority] = useState('medium');
  const [orderType, setOrderType] = useState('reparacion');
  const [quoteNumber, setQuoteNumber] = useState('');
  const [quoteBranchId, setQuoteBranchId] = useState('');
  const [quoteCustomerId, setQuoteCustomerId] = useState('');
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

    apiRequest<Branch[]>('/branches', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((list) => {
        setBranches(list);
        if (!orderBranchId && list.length > 0) setOrderBranchId(list[0].id);
      })
      .catch((err) => setError(err.message || 'Error cargando sucursales'));

    apiRequest<WorkOrderStatus[]>('/work-order-statuses', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((list) => {
        setStatuses(list);
        if (!orderStatusId && list.length > 0) setOrderStatusId(list[0].id);
      })
      .catch((err) => setError(err.message || 'Error cargando estados'));

    apiRequest<WorkOrder[]>('/work-orders', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(setWorkOrders)
      .catch((err) => setError(err.message || 'Error cargando órdenes'));

    apiRequest<Quote[]>('/quotes', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(setQuotes)
      .catch((err) => setError(err.message || 'Error cargando cotizaciones'));

    apiRequest<Product[]>('/products', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(setProducts)
      .catch((err) => setError(err.message || 'Error cargando productos'));

    apiRequest<Inventory[]>('/inventory', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(setInventory)
      .catch((err) => setError(err.message || 'Error cargando inventario'));
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

  async function createWorkOrder(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!token) return;
    try {
      const created = await apiRequest<WorkOrder>('/work-orders', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          orderNumber,
          branchId: orderBranchId,
          customerId: orderCustomerId,
          assetId: orderAssetId || undefined,
          statusId: orderStatusId,
          priority: orderPriority,
          orderType: orderType,
        }),
      });
      setWorkOrders((prev) => [created, ...prev]);
      setOrderNumber('');
      setOrderCustomerId('');
      setOrderAssetId('');
      setOrderPriority('medium');
      setOrderType('reparacion');
    } catch (err: any) {
      setError(err.message || 'Error creando orden');
    }
  }

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
      setInvBranchId('');
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
          <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/80 backdrop-blur">
            <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between gap-4">
              <div>
                <h1 className="text-xl font-semibold text-ink">Panel operativo</h1>
                <p className="text-sm text-gray-500">Resumen en tiempo real</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="hidden md:flex items-center gap-2 rounded-full border border-gray-200 px-3 py-2 text-sm text-gray-500">
                  <span className="h-2 w-2 rounded-full bg-brand" />
                  Operativo
                </div>
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
            </div>
          </header>

          <div className="mx-auto max-w-6xl px-6 py-8 space-y-10">
            <section className="grid gap-4 md:grid-cols-4">
              {[
                { label: 'Clientes', value: customers.length },
                { label: 'Activos', value: assets.length },
                { label: 'Órdenes', value: workOrders.length },
                { label: 'Cotizaciones', value: quotes.length },
              ].map((card) => (
                <div key={card.label} className="rounded-2xl bg-white p-5 shadow">
                  <p className="text-xs uppercase text-gray-500">{card.label}</p>
                  <p className="mt-2 text-2xl font-semibold text-ink">{card.value}</p>
                </div>
              ))}
            </section>

            <div className="grid gap-6 lg:grid-cols-3">
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
                <h2 className="text-lg font-semibold text-ink">Clientes</h2>
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
                      {customers.map((c) => (
                        <tr key={c.id} className="border-t border-gray-100">
                          <td className="py-2">
                            {c.firstName} {c.lastName || ''}
                          </td>
                          <td className="py-2">{c.email || '-'}</td>
                          <td className="py-2">{c.phone || '-'}</td>
                        </tr>
                      ))}
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

            <div className="grid gap-6 lg:grid-cols-3">
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
              </section>

              <section className="lg:col-span-2 rounded-2xl bg-white p-6 shadow">
                <h2 className="text-lg font-semibold text-ink">Activos</h2>
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

            <div className="grid gap-6 lg:grid-cols-3">
              <section className="lg:col-span-1 rounded-2xl bg-white p-6 shadow">
                <h2 className="text-lg font-semibold text-ink">Nueva OT</h2>
                <form className="mt-4 space-y-3" onSubmit={createWorkOrder}>
                  <input
                    className="w-full rounded-md border border-gray-200 px-3 py-2"
                    placeholder="Número de orden (ej: OT-0001)"
                    value={orderNumber}
                    onChange={(e) => setOrderNumber(e.target.value)}
                    required
                  />
                  <select
                    className="w-full rounded-md border border-gray-200 px-3 py-2"
                    value={orderBranchId}
                    onChange={(e) => setOrderBranchId(e.target.value)}
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
                    value={orderCustomerId}
                    onChange={(e) => setOrderCustomerId(e.target.value)}
                    required
                  >
                    <option value="">Cliente</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.firstName} {c.lastName || ''}
                      </option>
                    ))}
                  </select>
                  <select
                    className="w-full rounded-md border border-gray-200 px-3 py-2"
                    value={orderAssetId}
                    onChange={(e) => setOrderAssetId(e.target.value)}
                  >
                    <option value="">Activo (opcional)</option>
                    {assets
                      .filter((a) => a.customerId === orderCustomerId)
                      .map((a) => (
                        <option key={a.id} value={a.id}>
                          {[a.brand, a.model, a.serialNumber].filter(Boolean).join(' ')}
                        </option>
                      ))}
                  </select>
                  <select
                    className="w-full rounded-md border border-gray-200 px-3 py-2"
                    value={orderStatusId}
                    onChange={(e) => setOrderStatusId(e.target.value)}
                    required
                  >
                    <option value="">Estado</option>
                    {statuses.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                  <select
                    className="w-full rounded-md border border-gray-200 px-3 py-2"
                    value={orderPriority}
                    onChange={(e) => setOrderPriority(e.target.value)}
                  >
                    <option value="low">Baja</option>
                    <option value="medium">Media</option>
                    <option value="high">Alta</option>
                    <option value="urgent">Urgente</option>
                  </select>
                  <input
                    className="w-full rounded-md border border-gray-200 px-3 py-2"
                    placeholder="Tipo (reparacion, mantenimiento, etc.)"
                    value={orderType}
                    onChange={(e) => setOrderType(e.target.value)}
                  />
                  <button className="w-full rounded-md bg-brand py-2 text-white font-medium">
                    Crear OT
                  </button>
                </form>
              </section>

              <section className="lg:col-span-2 rounded-2xl bg-white p-6 shadow">
                <h2 className="text-lg font-semibold text-ink">Órdenes de trabajo</h2>
                <div className="mt-4 overflow-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-500">
                        <th className="py-2">Número</th>
                        <th className="py-2">Cliente</th>
                        <th className="py-2">Estado</th>
                        <th className="py-2">Prioridad</th>
                      </tr>
                    </thead>
                    <tbody>
                      {workOrders.map((o) => {
                        const customer = customers.find((c) => c.id === o.customerId);
                        const status = statuses.find((s) => s.id === o.statusId);
                        return (
                          <tr key={o.id} className="border-t border-gray-100">
                            <td className="py-2">{o.orderNumber}</td>
                            <td className="py-2">
                              {customer ? `${customer.firstName} ${customer.lastName || ''}` : o.customerId}
                            </td>
                            <td className="py-2">{status?.name || '-'}</td>
                            <td className="py-2">{o.priority || '-'}</td>
                          </tr>
                        );
                      })}
                      {workOrders.length === 0 ? (
                        <tr>
                          <td className="py-4 text-gray-500" colSpan={4}>
                            No hay órdenes aún.
                          </td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
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
                    value={quoteBranchId || branches[0]?.id || ''}
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
              </section>

              <section className="lg:col-span-2 rounded-2xl bg-white p-6 shadow">
                <h2 className="text-lg font-semibold text-ink">Cotizaciones</h2>
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

            <div className="grid gap-6 lg:grid-cols-3 pb-16">
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
                      {inventory.map((i: any) => {
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
      </div>
    </main>
  );
}
