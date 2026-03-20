'use client';

import { useEffect, useState } from 'react';
import { Sidebar } from '../../components/Sidebar';
import { apiRequest } from '../../lib/api';

const tabs = [
  { id: 'webhooks', label: 'Webhooks' },
  { id: 'zapier', label: 'Zapier' },
  { id: 'make', label: 'Make', badge: 'Beta' },
  { id: 'woocommerce', label: 'WooCommerce', badge: 'Beta' },
  { id: 's3', label: 'Amazon S3' },
  { id: 'smtp', label: 'SMTP' },
];

export default function IntegracionesPage() {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  const [accessKeyId, setAccessKeyId] = useState('');
  const [secretAccessKey, setSecretAccessKey] = useState('');
  const [bucket, setBucket] = useState('');
  const [region, setRegion] = useState('');
  const [endpoint, setEndpoint] = useState('');
  const [basePath, setBasePath] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [testing, setTesting] = useState(false);
  const [testMessage, setTestMessage] = useState('');

  useEffect(() => {
    if (!token) return;
    apiRequest<any>('/integrations/s3', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((cfg) => {
        if (!cfg) return;
        setAccessKeyId(cfg.accessKeyId || '');
        setSecretAccessKey(cfg.secretAccessKey || '');
        setBucket(cfg.bucket || '');
        setRegion(cfg.region || '');
        setEndpoint(cfg.endpoint || '');
        setBasePath(cfg.basePath || '');
        setIsActive(cfg.isActive ?? true);
      })
      .catch(() => {});
  }, [token]);

  return (
    <main className="min-h-screen">
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1">
          <header className="border-b border-gray-200 bg-white/80 backdrop-blur">
            <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
              <h1 className="text-xl font-semibold text-ink">Integraciones</h1>
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

          <div className="mx-auto max-w-6xl px-6 py-8 space-y-6">
            <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-white p-3 shadow">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  className={`rounded-full px-4 py-2 text-sm ${
                    tab.id === 's3' ? 'bg-brand text-white' : 'bg-sand text-gray-600 hover:text-ink'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {tab.label}
                    {tab.badge ? (
                      <span className="rounded-full bg-white/70 px-2 py-0.5 text-[10px] text-gray-700">
                        {tab.badge}
                      </span>
                    ) : null}
                  </span>
                </button>
              ))}
            </div>

            <section className="rounded-3xl bg-white p-8 shadow">
              <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
                <div className="flex items-center justify-center rounded-3xl bg-sand p-6">
                  <div className="text-center">
                    <div className="text-5xl font-black text-ink">S3</div>
                    <p className="mt-2 text-xs text-gray-500">Almacenamiento de archivos</p>
                  </div>
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-ink">Integración con Amazon S3</h2>
                  <p className="mt-2 text-sm text-gray-600">
                    Conecta tu cuenta S3 para almacenar fotos, adjuntos y respaldos. Esta pantalla es solo el
                    diseño del formulario. La conexión real la activamos después.
                  </p>
                  {message ? (
                    <div className="mt-4 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700">
                      {message}
                    </div>
                  ) : null}
                  {testMessage ? (
                    <div className="mt-3 rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-700">
                      {testMessage}
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="mt-8 rounded-2xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-ink">Configuración</h3>
                <div className="mt-4 grid gap-4 md:grid-cols-3">
                  <div>
                    <label className="text-sm text-gray-600">Clave de acceso *</label>
                    <input
                      className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                      placeholder="AKIA..."
                      value={accessKeyId}
                      onChange={(e) => setAccessKeyId(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Clave secreta *</label>
                    <input
                      className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                      placeholder="••••••••••••"
                      type="password"
                      value={secretAccessKey}
                      onChange={(e) => setSecretAccessKey(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Bucket *</label>
                    <input
                      className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                      placeholder="tallerhub-files"
                      value={bucket}
                      onChange={(e) => setBucket(e.target.value)}
                    />
                  </div>
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-3">
                  <div>
                    <label className="text-sm text-gray-600">Región</label>
                    <input
                      className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                      placeholder="us-east-1"
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Endpoint</label>
                    <input
                      className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                      placeholder="https://s3.amazonaws.com"
                      value={endpoint}
                      onChange={(e) => setEndpoint(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Carpeta base</label>
                    <input
                      className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                      placeholder="uploads/"
                      value={basePath}
                      onChange={(e) => setBasePath(e.target.value)}
                    />
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <button className="rounded-full bg-sand px-4 py-2 text-sm text-gray-600">🗑 Eliminar</button>
                  <button
                    className="rounded-full bg-sand px-4 py-2 text-sm text-gray-600"
                    onClick={() => setIsActive(false)}
                  >
                    ⏸ Suspender
                  </button>
                  <div className="ml-auto flex items-center gap-2">
                    <button
                      className="rounded-full bg-sand px-4 py-2 text-sm text-gray-600"
                      onClick={async () => {
                        if (!token) return;
                        setTesting(true);
                        setTestMessage('');
                        try {
                          await apiRequest('/integrations/s3/test', {
                            method: 'POST',
                            headers: { Authorization: `Bearer ${token}` },
                            body: JSON.stringify({
                              accessKeyId,
                              secretAccessKey,
                              bucket,
                              region,
                              endpoint,
                            }),
                          });
                          setTestMessage('Conexión exitosa con S3.');
                        } catch (err: any) {
                          setTestMessage(err.message || 'No se pudo conectar con S3.');
                        } finally {
                          setTesting(false);
                        }
                      }}
                    >
                      {testing ? 'Probando...' : '⚡ Probar'}
                    </button>
                    <button
                      className="rounded-full bg-brand px-4 py-2 text-sm text-white"
                      onClick={async () => {
                        if (!token) return;
                        setSaving(true);
                        setMessage('');
                        try {
                          await apiRequest('/integrations/s3', {
                            method: 'PUT',
                            headers: { Authorization: `Bearer ${token}` },
                            body: JSON.stringify({
                              accessKeyId,
                              secretAccessKey,
                              bucket,
                              region,
                              endpoint,
                              basePath,
                              isActive,
                            }),
                          });
                          setMessage('Configuración guardada.');
                        } finally {
                          setSaving(false);
                        }
                      }}
                    >
                      {saving ? 'Guardando...' : '💾 Guardar'}
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
