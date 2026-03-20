'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { API_URL } from '../../../../lib/api';

type PublicOrder = {
  id: string;
  orderNumber: string;
  createdAt?: string | null;
  promisedAt?: string | null;
  priority?: string | null;
  orderType?: string | null;
  initialDiagnosis?: string | null;
  technicalDiagnosis?: string | null;
  clientNotes?: string | null;
  totalAmount?: number;
  discountAmount?: number;
  taxAmount?: number;
  status?: { name?: string | null };
  quoteApproved?: boolean;
  branch?: { name?: string | null; phone?: string | null };
  customer?: {
    firstName?: string | null;
    lastName?: string | null;
    legalName?: string | null;
    taxId?: string | null;
    phone?: string | null;
    email?: string | null;
  };
  asset?: {
    brand?: string | null;
    model?: string | null;
    serialNumber?: string | null;
    assetType?: string | null;
  };
  items: Array<{
    id: string;
    description?: string | null;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  comments: Array<{
    id: string;
    content: string;
    createdAt: string;
    userName?: string | null;
  }>;
  attachments: Array<{
    id: string;
    fileName: string;
    fileUrl: string;
    mimeType?: string | null;
  }>;
  termsAndConditions?: string | null;
};

function formatDate(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatMoney(value?: number | null) {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function normalizePriority(value?: string | null) {
  const map: Record<string, string> = {
    low: 'Baja',
    medium: 'Normal',
    high: 'Alta',
    urgent: 'Urgente',
  };
  return map[(value || '').toLowerCase()] || 'Normal';
}

export default function OrdenPublicaPage() {
  const params = useParams<{ orderNumber: string }>();
  const [data, setData] = useState<PublicOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const orderNumber = params?.orderNumber;
    if (!orderNumber) return;

    setLoading(true);
    setError(null);

    fetch(`${API_URL}/public/work-orders/${encodeURIComponent(orderNumber)}`, {
      method: 'GET',
      cache: 'no-store',
    })
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.message || 'No fue posible cargar la orden');
        }
        return res.json();
      })
      .then((json: PublicOrder) => setData(json))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [params?.orderNumber]);

  const customerName = useMemo(() => {
    if (!data?.customer) return 'Cliente no disponible';
    const full = [data.customer.firstName, data.customer.lastName].filter(Boolean).join(' ').trim();
    return full || data.customer.legalName || 'Cliente no disponible';
  }, [data?.customer]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#efefef] px-6 py-10 text-ink">
        <div className="mx-auto max-w-6xl rounded-2xl border border-gray-200 bg-white p-6">Cargando orden...</div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="min-h-screen bg-[#efefef] px-6 py-10 text-ink">
        <div className="mx-auto max-w-6xl rounded-2xl border border-red-200 bg-white p-6">
          <h1 className="text-xl font-semibold">No pudimos abrir esta orden</h1>
          <p className="mt-2 text-gray-600">{error || 'Orden no encontrada'}</p>
          <Link href="/" className="mt-4 inline-block rounded-lg border border-gray-300 px-3 py-2 text-sm">
            Volver
          </Link>
        </div>
      </main>
    );
  }

  const subtotal = data.items.reduce((acc, item) => acc + Number(item.totalPrice || 0), 0);
  const total = Number(data.totalAmount || subtotal);

  return (
    <main className="min-h-screen bg-[#e9e9e9] px-4 py-6 text-ink md:px-8">
      <div className="mx-auto max-w-6xl space-y-5">
        <header className="rounded-2xl bg-white px-6 py-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h1 className="text-[42px] font-semibold tracking-tight text-gray-800">JAMET SERVICE</h1>
            <div className="flex items-center gap-2 text-sm">
              <button
                onClick={() => history.back()}
                className="rounded-lg border border-gray-300 px-3 py-2 text-gray-700 hover:bg-gray-50"
              >
                ←
              </button>
              <button
                onClick={() => window.print()}
                className="rounded-lg border border-gray-300 px-3 py-2 text-gray-700 hover:bg-gray-50"
              >
                🖨
              </button>
            </div>
          </div>
        </header>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-[44px] font-semibold text-gray-800">Orden de trabajo N° {data.orderNumber}</h2>
          <div className="mt-4 rounded-xl border border-gray-200 p-4 text-[22px]">
            <p>
              <span className="font-semibold text-brand">Sucursal asignada:</span> {data.branch?.name || 'Casa Central'}
            </p>
            <p className="mt-3 text-[19px]">
              <span className="font-semibold">Teléfono:</span> {data.branch?.phone || data.customer?.phone || 'No cargado'}
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-[30px] font-semibold text-brand">Orden de trabajo</h3>
          <div className="mt-3 grid gap-3 text-[20px] md:grid-cols-2">
            <p><span className="font-semibold">Prioridad:</span> {normalizePriority(data.priority)}</p>
            <p><span className="font-semibold">Creada:</span> {formatDate(data.createdAt)}</p>
            <p><span className="font-semibold">Área / Estado:</span> {data.orderType || '—'} / {data.status?.name || '—'}</p>
            <p><span className="font-semibold">Trabajo:</span> {data.initialDiagnosis || 'Sin detalle'}</p>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">{data.customer?.taxId || 'Persona'}</p>
            <p className="mt-1 text-2xl font-semibold">{customerName}</p>
            <p className="mt-2 text-lg text-gray-700">{data.customer?.email || 'No cargado'}</p>
            <p className="text-lg text-gray-700">{data.customer?.phone || 'No cargado'}</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">{data.asset?.assetType || 'Equipo'}</p>
            <p className="mt-1 text-2xl font-semibold">
              {[data.asset?.brand, data.asset?.model].filter(Boolean).join(', ') || 'No cargado'}
            </p>
            <p className="mt-2 text-lg text-gray-700">{data.asset?.serialNumber || 'Genérico'}</p>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-0 shadow-sm">
          <div className="border-b border-gray-200 p-5">
            <h3 className="text-[32px] font-semibold text-brand">Presupuesto</h3>
            <p className="text-lg text-gray-600">Los siguientes productos/servicios fueron aplicados en su orden de trabajo:</p>
          </div>
          <table className="w-full text-left text-[20px]">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-5 py-3">Descripción</th>
                <th className="px-5 py-3 text-right">Ct.</th>
                <th className="px-5 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item) => (
                <tr key={item.id} className="border-b border-gray-100">
                  <td className="px-5 py-3">{item.description || 'Ítem'}</td>
                  <td className="px-5 py-3 text-right">{Number(item.quantity || 0)}</td>
                  <td className="px-5 py-3 text-right">{formatMoney(item.totalPrice)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="p-5 text-right text-[22px]">
            <p><span className="font-semibold">Subtotal:</span> {formatMoney(subtotal)}</p>
            <p className="mt-1"><span className="font-semibold">Total:</span> {formatMoney(total)}</p>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-[30px] font-semibold text-brand">Notas</h3>
          <div className="mt-3 space-y-3 text-[20px]">
            {data.comments.length ? (
              data.comments.map((comment) => (
                <p key={comment.id}>
                  {formatDate(comment.createdAt)} - {comment.content}
                </p>
              ))
            ) : (
              <p className="text-gray-500">Sin notas públicas.</p>
            )}
          </div>
        </section>

        {data.attachments.length ? (
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-[30px] font-semibold text-brand">Archivos</h3>
            <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
              {data.attachments.map((file) => (
                <a
                  key={file.id}
                  href={file.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="overflow-hidden rounded-xl border border-gray-200 bg-gray-50"
                >
                  {(file.mimeType || '').includes('image') ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={file.fileUrl} alt={file.fileName} className="h-36 w-full object-cover" />
                  ) : (
                    <div className="flex h-36 items-center justify-center p-2 text-center text-sm text-gray-600">
                      {file.fileName}
                    </div>
                  )}
                </a>
              ))}
            </div>
          </section>
        ) : null}

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-[30px] font-semibold text-brand">Términos y condiciones</h3>
          <p className="mt-3 text-[19px] text-gray-700">{data.termsAndConditions || 'Sin términos configurados.'}</p>
        </section>
      </div>
    </main>
  );
}
