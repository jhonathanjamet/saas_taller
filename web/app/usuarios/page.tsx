'use client';

import { useEffect, useMemo, useState } from 'react';
import { Sidebar } from '../../components/Sidebar';
import { apiRequest } from '../../lib/api';

type UserOption = {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
};

type ResponsibleOption = {
  id: string;
  name: string;
  email?: string | null;
};

const ENABLED_KEY = 'order_responsibles_enabled_ids';
const CATALOG_KEY = 'order_responsibles_catalog';

const safeParse = <T,>(raw: string | null, fallback: T): T => {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

export default function UsuariosPage() {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

  const [users, setUsers] = useState<ResponsibleOption[]>([]);
  const [enabledIds, setEnabledIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const selectedCount = useMemo(
    () => users.filter((u) => enabledIds.includes(u.id)).length,
    [users, enabledIds],
  );

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const localEnabled = safeParse<string[]>(
        typeof window !== 'undefined' ? localStorage.getItem(ENABLED_KEY) : null,
        [],
      );
      setEnabledIds(localEnabled);

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const list = await apiRequest<UserOption[]>('/users', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const mapped = list.map((u) => ({
          id: u.id,
          name: [u.firstName, u.lastName].filter(Boolean).join(' ').trim() || u.email || 'Usuario',
          email: u.email || null,
        }));
        setUsers(mapped);
        localStorage.setItem(CATALOG_KEY, JSON.stringify(mapped));

        if (!localEnabled.length && mapped.length) {
          const onlyJhonathan = mapped.find((u) =>
            u.name.toLowerCase().includes('jhonathan jamet'),
          );
          const defaultIds = [onlyJhonathan?.id || mapped[0].id];
          setEnabledIds(defaultIds);
          localStorage.setItem(ENABLED_KEY, JSON.stringify(defaultIds));
        }
      } catch {
        const fromStorage = safeParse<ResponsibleOption[]>(
          typeof window !== 'undefined' ? localStorage.getItem(CATALOG_KEY) : null,
          [],
        );
        setUsers(fromStorage);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token]);

  return (
    <main className="min-h-screen">
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1">
          <header className="border-b border-gray-200 bg-white/80 backdrop-blur">
            <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
              <h1 className="text-xl font-semibold text-ink">Usuarios</h1>
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
            <section className="rounded-3xl bg-white p-6 shadow">
              <h2 className="text-xl font-semibold text-ink">Responsables para órdenes de trabajo</h2>
              <p className="mt-1 text-sm text-gray-600">
                Marca quiénes aparecen en el selector de Responsable al crear la orden.
              </p>

              <div className="mt-4 rounded-xl bg-sand px-4 py-3 text-sm text-gray-700">
                Seleccionados: <span className="font-semibold">{selectedCount}</span>
              </div>

              {message ? (
                <div className="mt-3 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700">
                  {message}
                </div>
              ) : null}

              <div className="mt-4 space-y-2">
                {loading ? (
                  <div className="rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-500">
                    Cargando usuarios...
                  </div>
                ) : users.length === 0 ? (
                  <div className="rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-500">
                    No hay usuarios disponibles.
                  </div>
                ) : (
                  users.map((u) => (
                    <label
                      key={u.id}
                      className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-ink">{u.name}</p>
                        <p className="text-xs text-gray-500">{u.email || 'Sin email'}</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={enabledIds.includes(u.id)}
                        onChange={(e) => {
                          setEnabledIds((prev) =>
                            e.target.checked ? [...new Set([...prev, u.id])] : prev.filter((id) => id !== u.id),
                          );
                        }}
                      />
                    </label>
                  ))
                )}
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <button
                  className="rounded-full bg-sand px-4 py-2 text-sm text-gray-700"
                  onClick={() => {
                    const all = users.map((u) => u.id);
                    setEnabledIds(all);
                  }}
                  type="button"
                >
                  Seleccionar todo
                </button>
                <button
                  className="rounded-full bg-brand px-4 py-2 text-sm text-white"
                  onClick={() => {
                    setSaving(true);
                    localStorage.setItem(ENABLED_KEY, JSON.stringify(enabledIds));
                    localStorage.setItem(CATALOG_KEY, JSON.stringify(users));
                    window.dispatchEvent(new CustomEvent('order-responsibles-updated'));
                    setMessage('Configuración guardada. Ya puedes crear órdenes con esta lista.');
                    setTimeout(() => setSaving(false), 250);
                  }}
                  type="button"
                  disabled={saving}
                >
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}

